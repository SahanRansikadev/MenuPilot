const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Hotel = require("../src/models/Hotel");
const KitchenTask = require("../src/models/KitchenTask");
const Menu = require("../src/models/Menu");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("admins can create and edit hotels, and hotels used by menus are protected from deletion", async (t) => {
  const originals = {
    sessionFindOne: Session.findOne,
    userFindById: User.findById,
    hotelCreate: Hotel.create,
    hotelFindById: Hotel.findById,
    hotelFindByIdAndUpdate: Hotel.findByIdAndUpdate,
    hotelFindByIdAndDelete: Hotel.findByIdAndDelete,
    menuExists: Menu.exists,
    taskExists: KitchenTask.exists,
  };
  const adminId = new mongoose.Types.ObjectId();
  const hotelId = new mongoose.Types.ObjectId();
  let savedHotel;
  let deleteAttempted = false;

  Session.findOne = () => ({ lean: async () => ({ userId: adminId }) });
  User.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: adminId, role: "admin" }),
  });
  Hotel.create = async (hotel) => {
    savedHotel = { ...hotel, _id: hotelId };
    return savedHotel;
  };
  Hotel.findById = () => ({ lean: async () => savedHotel });
  Hotel.findByIdAndUpdate = (_id, update) => ({
    select() { return this; },
    lean: async () => {
      savedHotel = { ...savedHotel, ...update.$set };
      return savedHotel;
    },
  });
  Hotel.findByIdAndDelete = async () => {
    deleteAttempted = true;
    return savedHotel;
  };
  Menu.exists = async () => ({ _id: new mongoose.Types.ObjectId() });
  KitchenTask.exists = async () => null;
  t.after(() => {
    Session.findOne = originals.sessionFindOne;
    User.findById = originals.userFindById;
    Hotel.create = originals.hotelCreate;
    Hotel.findById = originals.hotelFindById;
    Hotel.findByIdAndUpdate = originals.hotelFindByIdAndUpdate;
    Hotel.findByIdAndDelete = originals.hotelFindByIdAndDelete;
    Menu.exists = originals.menuExists;
    KitchenTask.exists = originals.taskExists;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}/api/admin/hotels`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=hotel-admin-session",
  };
  const details = {
    name: "Villa Serene",
    location: "Galle",
    description: "",
    contactName: "",
    phone: "",
    email: "",
  };

  const createResponse = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(details),
  });
  assert.equal(createResponse.status, 201);
  assert.equal((await createResponse.json()).hotel.name, "Villa Serene");
  assert.equal(savedHotel.normalizedName, "villa serene");
  assert.equal(savedHotel.createdBy.toString(), adminId.toString());

  const updateResponse = await fetch(`${baseUrl}/${hotelId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ ...details, description: "Coastal hotel" }),
  });
  assert.equal(updateResponse.status, 200);
  assert.equal((await updateResponse.json()).hotel.description, "Coastal hotel");

  const deleteResponse = await fetch(`${baseUrl}/${hotelId}`, { method: "DELETE", headers });
  assert.equal(deleteResponse.status, 409);
  assert.equal(deleteAttempted, false);
});

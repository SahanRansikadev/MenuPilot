const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const KitchenTask = require("../src/models/KitchenTask");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("kitchen team can see assigned work and advance its status", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindById = User.findById;
  const originalKitchenTaskFind = KitchenTask.find;
  const originalKitchenTaskFindOne = KitchenTask.findOne;
  const kitchenMemberId = new mongoose.Types.ObjectId();
  const taskId = new mongoose.Types.ObjectId();
  const bookingId = new mongoose.Types.ObjectId();
  let queriedAssignee;
  let saved = false;
  const task = {
    _id: taskId,
    assignedTo: kitchenMemberId,
    bookingId: { _id: bookingId, date: new Date("2026-12-05T00:00:00.000Z"), guestCount: 4 },
    hotelName: "Villa Serene",
    recipeName: "Coconut curry",
    mealType: "Dinner",
    description: "",
    ingredients: ["Coconut milk", "Chicken"],
    instructions: "Simmer until cooked.",
    notes: "Serve at 7pm.",
    status: "sent",
    createdAt: new Date("2026-11-29T00:00:00.000Z"),
    async save() { saved = true; },
  };

  Session.findOne = () => ({ lean: async () => ({ userId: kitchenMemberId }) });
  User.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: kitchenMemberId, role: "kitchenTeam" }),
  });
  KitchenTask.find = (query) => {
    queriedAssignee = query.assignedTo;
    return {
      populate() { return this; },
      sort() { return this; },
      limit() { return this; },
      lean: async () => [task],
    };
  };
  KitchenTask.findOne = (query) => {
    assert.equal(query.assignedTo.toString(), kitchenMemberId.toString());
    return task;
  };
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    User.findById = originalUserFindById;
    KitchenTask.find = originalKitchenTaskFind;
    KitchenTask.findOne = originalKitchenTaskFindOne;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}/api/kitchen/tasks`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=kitchen-test-session",
  };

  const listResponse = await fetch(baseUrl, { headers });
  assert.equal(listResponse.status, 200);
  const result = await listResponse.json();
  assert.equal(result.tasks[0].recipeName, "Coconut curry");
  assert.deepEqual(result.tasks[0].ingredients, ["Coconut milk", "Chicken"]);
  assert.equal(queriedAssignee.toString(), kitchenMemberId.toString());

  const statusResponse = await fetch(`${baseUrl}/${taskId}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "accepted" }),
  });
  assert.equal(statusResponse.status, 200);
  assert.equal((await statusResponse.json()).task.status, "accepted");
  assert.equal(task.status, "accepted");
  assert.equal(saved, true);
});

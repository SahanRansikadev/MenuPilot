const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("admin and kitchen can view guest feedback, but only admins can reply and like", async (t) => {
  const originals = {
    sessionFindOne: Session.findOne,
    userFindById: User.findById,
    userFind: User.find,
    userFindOneAndUpdate: User.findOneAndUpdate,
  };
  const adminId = new mongoose.Types.ObjectId();
  const guestId = new mongoose.Types.ObjectId();
  let requesterRole = "kitchenTeam";
  const guest = {
    _id: guestId,
    name: "Casey Guest",
    email: "casey@example.com",
    role: "guest",
    feedback: "The stay was wonderful.",
    feedbackReply: "",
    feedbackLiked: false,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  Session.findOne = () => ({ lean: async () => ({ userId: adminId }) });
  User.findById = (id) => ({
    select() { return this; },
    lean: async () => ({ _id: id, role: requesterRole }),
  });
  User.find = () => ({
    select() { return this; },
    sort() { return this; },
    limit() { return this; },
    lean: async () => [guest],
  });
  User.findOneAndUpdate = (_query, update) => {
    Object.assign(guest, update.$set);
    return {
      select() { return this; },
      lean: async () => guest,
    };
  };
  t.after(() => {
    Session.findOne = originals.sessionFindOne;
    User.findById = originals.userFindById;
    User.find = originals.userFind;
    User.findOneAndUpdate = originals.userFindOneAndUpdate;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  const baseUrl = `http://127.0.0.1:${address.port}/api/feedback`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=feedback-test-session",
  };

  const listResponse = await fetch(baseUrl, { headers });
  assert.equal(listResponse.status, 200);
  assert.equal((await listResponse.json()).feedback[0].feedback, guest.feedback);

  const kitchenReplyResponse = await fetch(`${baseUrl}/${guestId}/reply`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ reply: "Thank you!" }),
  });
  assert.equal(kitchenReplyResponse.status, 403);
  const kitchenLikeResponse = await fetch(`${baseUrl}/${guestId}/like`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ liked: true }),
  });
  assert.equal(kitchenLikeResponse.status, 403);

  requesterRole = "guest";
  const guestListResponse = await fetch(baseUrl, { headers });
  assert.equal(guestListResponse.status, 403);

  requesterRole = "admin";
  const replyResponse = await fetch(`${baseUrl}/${guestId}/reply`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ reply: "Thank you for staying with us!" }),
  });
  assert.equal(replyResponse.status, 200);
  assert.equal((await replyResponse.json()).feedback.reply, "Thank you for staying with us!");

  const likeResponse = await fetch(`${baseUrl}/${guestId}/like`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ liked: true }),
  });
  assert.equal(likeResponse.status, 200);
  assert.equal((await likeResponse.json()).feedback.liked, true);
});

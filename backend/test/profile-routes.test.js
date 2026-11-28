const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("authenticated guests can load and save a profile with their account identity retained", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindById = User.findById;
  const originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
  const userId = new mongoose.Types.ObjectId();
  let updatedUser;
  const accountUser = {
    _id: userId,
    name: "Alex Morgan",
    email: "alex@example.com",
    phone: "",
    guestCount: 1,
    childrenCount: 0,
    countryCode: "",
    feedback: "",
  };

  Session.findOne = () => ({ lean: async () => ({ userId }) });
  User.findById = () => ({
    select() { return this; },
    lean: async () => accountUser,
  });
  User.findByIdAndUpdate = (id, update, options) => {
    assert.equal(id.toString(), userId.toString());
    assert.deepEqual(update.$set, {
      phone: "+94771234567",
      guestCount: 4,
      childrenCount: 1,
      countryCode: "LK",
      feedback: "Helpful hotel team.",
      feedbackReply: "",
      feedbackLiked: false,
    });
    assert.equal(options.runValidators, true);
    updatedUser = {
      _id: userId,
      name: "Alex Morgan",
      email: "alex@example.com",
      ...update.$set,
    };
    return {
      select() { return this; },
      lean: async () => updatedUser,
    };
  };
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    User.findById = originalUserFindById;
    User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}/api/auth`;
  const profileResponse = await fetch(`${baseUrl}/me`, {
    headers: { Cookie: "menupilot_session=test-session-token" },
  });
  assert.equal(profileResponse.status, 200);
  const profileResult = await profileResponse.json();
  assert.equal(profileResult.user.name, "Alex Morgan");
  assert.equal(profileResult.user.email, "alex@example.com");
  assert.equal(profileResult.user.guestCount, 1);
  assert.equal(profileResult.user.childrenCount, 0);

  const response = await fetch(`${baseUrl}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: "menupilot_session=test-session-token",
    },
    body: JSON.stringify({
      phone: "+94 (77) 123-4567",
      guestCount: 4,
      childrenCount: 1,
      countryCode: "LK",
      feedback: "  Helpful hotel team.  ",
    }),
  });

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.user.name, "Alex Morgan");
  assert.equal(result.user.email, "alex@example.com");
  assert.equal(result.user.phone, "+94771234567");
  assert.equal(result.user.guestCount, 4);
  assert.equal(result.user.childrenCount, 1);
  assert.equal(result.user.countryCode, "LK");
  assert.equal(result.user.feedback, "Helpful hotel team.");
});

const assert = require("node:assert/strict");
const test = require("node:test");
const User = require("../src/models/User");
const parseProfilePayload = require("../src/utils/profile-validation");

const validPayload = {
  phone: "+94 (77) 123-4567",
  guestCount: 4,
  childrenCount: 1,
  countryCode: "LK",
  feedback: "Helpful hotel team.",
};

test("normalizes a valid guest profile", () => {
  assert.deepEqual(parseProfilePayload(validPayload).value, {
    phone: "+94771234567",
    guestCount: 4,
    childrenCount: 1,
    countryCode: "LK",
    feedback: "Helpful hotel team.",
  });
});

test("rejects invalid counts, phone numbers, country codes, and feedback", () => {
  assert.match(parseProfilePayload({ ...validPayload, phone: "12" }).error, /Contact number/);
  assert.match(parseProfilePayload({ ...validPayload, guestCount: 0 }).error, /Guest count/);
  assert.match(parseProfilePayload({ ...validPayload, childrenCount: 5 }).error, /Child count/);
  assert.match(parseProfilePayload({ ...validPayload, countryCode: "LKA" }).error, /country/);
  assert.match(parseProfilePayload({ ...validPayload, feedback: "x".repeat(1001) }).error, /Feedback/);
});

test("allows new accounts to keep an unset country until their profile is completed", async () => {
  const user = new User({
    name: "Alex Morgan",
    email: "alex@example.com",
    passwordHash: "hashed-password",
  });

  await assert.doesNotReject(user.validate());
});

const assert = require("node:assert/strict");
const test = require("node:test");
const parseHotelPayload = require("../src/utils/hotel-validation");

const hotelPayload = {
  name: "  Villa   Serene ",
  location: "Galle, Sri Lanka",
  description: "A quiet coastal stay.",
  contactName: "Hotel Desk",
  phone: "+94 11 222 3333",
  email: " DESK@EXAMPLE.COM ",
};

test("normalizes hotel details for management", () => {
  assert.deepEqual(parseHotelPayload(hotelPayload).value, {
    name: "Villa Serene",
    normalizedName: "villa serene",
    location: "Galle, Sri Lanka",
    description: "A quiet coastal stay.",
    contactName: "Hotel Desk",
    phone: "+94 11 222 3333",
    email: "desk@example.com",
  });
});

test("requires a location and validates optional contact email", () => {
  assert.match(parseHotelPayload({ ...hotelPayload, location: "" }).error, /location/);
  assert.match(parseHotelPayload({ ...hotelPayload, email: "not-an-email" }).error, /email/);
});

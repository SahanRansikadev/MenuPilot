function parseHotelPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Enter valid hotel details." };
  }

  const name = typeof payload.name === "string" ? payload.name.trim().replace(/\s+/g, " ") : "";
  const location = typeof payload.location === "string" ? payload.location.trim().replace(/\s+/g, " ") : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const contactName = typeof payload.contactName === "string" ? payload.contactName.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

  if (!name || name.length > 100 || !location || location.length > 150) {
    return { error: "Hotel name and location are required and must be within their length limits." };
  }
  if (description.length > 500 || contactName.length > 100 || phone.length > 24) {
    return { error: "Description, contact name, or phone number exceeds its length limit." };
  }
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: "Enter a valid hotel contact email." };
  }

  return {
    value: {
      name,
      normalizedName: name.toLocaleLowerCase("en"),
      location,
      description,
      contactName,
      phone,
      email,
    },
  };
}

module.exports = parseHotelPayload;

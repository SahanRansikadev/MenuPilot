function parseProfilePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Enter valid guest profile details." };
  }

  const { phone, guestCount, childrenCount, countryCode, feedback = "" } = payload;
  if (typeof phone !== "string") {
    return { error: "Enter a valid contact number." };
  }

  const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
  if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
    return { error: "Contact number must contain 7 to 15 digits." };
  }
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 1000) {
    return { error: "Guest count must be between 1 and 1,000." };
  }
  if (!Number.isInteger(childrenCount) || childrenCount < 0 || childrenCount > guestCount) {
    return { error: "Child count must be between 0 and the guest count." };
  }
  if (typeof countryCode !== "string" || !/^[A-Z]{2}$/.test(countryCode)) {
    return { error: "Choose a country." };
  }
  if (typeof feedback !== "string" || feedback.length > 1000) {
    return { error: "Feedback must be 1,000 characters or fewer." };
  }

  return {
    value: {
      phone: normalizedPhone,
      guestCount,
      childrenCount,
      countryCode,
      feedback: feedback.trim(),
    },
  };
}

module.exports = parseProfilePayload;

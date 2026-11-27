const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (
  configuredApiUrl || "https://menu-pilot-backend.vercel.app/api"
).replace(/\/+$/, "");

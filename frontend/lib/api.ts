const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

const apiOrigin = configuredApiUrl || "https://menu-pilot-backend.vercel.app/api";

export const API_BASE_URL = /\/api$/i.test(apiOrigin) ? apiOrigin : `${apiOrigin}/api`;

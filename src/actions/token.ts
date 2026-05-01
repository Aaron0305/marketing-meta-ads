"use server";

/**
 * Convierte un token de corta duración en uno de larga duración (~60 días).
 * Usa la API de Meta OAuth para hacer el intercambio.
 */
export async function exchangeForLongLivedToken(): Promise<{
  token: string;
  expiresIn: number;
}> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const shortToken = process.env.META_ACCESS_TOKEN;

  if (!appId || !appSecret || !shortToken) {
    throw new Error("Faltan META_APP_ID, META_APP_SECRET o META_ACCESS_TOKEN en .env.local");
  }

  const url = new URL("https://graph.facebook.com/v25.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) {
    throw new Error(`Meta OAuth: ${data.error.message}`);
  }

  return {
    token: data.access_token,
    expiresIn: data.expires_in || 5184000, // ~60 días
  };
}

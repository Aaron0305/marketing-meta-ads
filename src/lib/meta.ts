/**
 * Meta Graph API Client
 *
 * Centraliza toda la comunicación con la Meta Graph API v21.0.
 * Incluye funciones para campañas, ad sets, ads e insights.
 *
 * Variables de entorno requeridas:
 *   - META_ACCESS_TOKEN (System User Token de larga duración)
 *   - META_AD_ACCOUNT_ID (act_XXXXXXXXXX)
 *
 * @see Fase 2-3 del plan maestro
 */

const META_API_VERSION = "v25.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Construye una URL completa para la Meta Graph API.
 */
export function buildMetaUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${META_BASE_URL}${path}`);
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN || "");

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * Realiza una petición autenticada a la Meta Graph API.
 */
export async function metaFetch<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const { params, ...fetchOptions } = options || {};
  const url = buildMetaUrl(path, params);

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions?.headers ? {} : { "Content-Type": "application/json" }),
      ...fetchOptions?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Meta API error (${response.status}): ${JSON.stringify(error)}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Obtiene el ID de la cuenta de anuncios desde las variables de entorno.
 */
export function getAdAccountId(): string {
  const id = process.env.META_AD_ACCOUNT_ID;
  if (!id) throw new Error("META_AD_ACCOUNT_ID no está configurado");
  return id;
}

// TODO: Fase 2 — getCampaigns(), getInsights(), getAccountInsights()
// TODO: Fase 3 — createCampaign(), createAdSet(), createAd(), updateCampaignStatus()

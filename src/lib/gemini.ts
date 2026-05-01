/**
 * Google Gemini API Client
 *
 * Centraliza la generación de contenido (copies + imágenes) con Gemini.
 *
 * - Copies: SDK @google/generative-ai con gemini-2.5-flash
 * - Imágenes: REST API directa con gemini-2.5-flash-image (soporta responseModalities)
 *
 * Variable de entorno requerida:
 *   - GOOGLE_GEMINI_API_KEY
 *
 * @see Fase 4 del plan maestro
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY no está configurado");
  return apiKey;
}

/**
 * Obtiene una instancia del modelo para generación de texto (copies).
 * Usa gemini-2.5-flash como primario.
 */
export function getCopyModel(modelName = "gemini-2.5-flash") {
  const client = new GoogleGenerativeAI(getApiKey());
  return client.getGenerativeModel({ model: modelName });
}

/**
 * Genera contenido con retry automático.
 * Si gemini-2.5-flash está saturado (503), reintenta con gemini-2.0-flash.
 */
export async function generateWithRetry(prompt: string | any[], maxRetries = 2): Promise<string> {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const modelName = attempt === 0 ? models[0] : models[1];
    try {
      console.log(`[Gemini] Intentando con ${modelName} (intento ${attempt + 1})`);
      const model = getCopyModel(modelName);
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      const is503 = err?.message?.includes("503") || err?.status === 503;
      const isRateLimit = err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");

      if ((is503 || isRateLimit) && attempt < maxRetries - 1) {
        console.warn(`[Gemini] ${modelName} no disponible, probando siguiente modelo...`);
        // Esperar 1 segundo antes de reintentar
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }

  throw new Error("Todos los modelos de Gemini fallaron");
}

/**
 * Genera una imagen usando la REST API de Gemini directamente.
 * El SDK npm no soporta responseModalities, así que usamos fetch.
 */
export async function generateImageWithGemini(
  prompt: string,
  referenceImage?: { base64: string; mimeType: string }
): Promise<{ base64: string; mimeType: string }> {
  const apiKey = getApiKey();
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Construir las partes del contenido
  const parts: any[] = [{ text: prompt }];

  // Si hay imagen de referencia, agregarla
  if (referenceImage) {
    parts.push({
      inline_data: {
        mime_type: referenceImage.mimeType,
        data: referenceImage.base64,
      },
    });
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Error de Gemini (${response.status}): ${errorData?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const candidates = data.candidates;
  if (!candidates?.[0]?.content?.parts) {
    throw new Error("Gemini no devolvió contenido válido");
  }

  // Buscar la parte que contiene la imagen
  const imagePart = candidates[0].content.parts.find(
    (part: any) => part.inline_data?.mime_type?.startsWith("image/")
  );

  if (!imagePart?.inline_data?.data) {
    throw new Error("Gemini no generó una imagen en la respuesta");
  }

  return {
    base64: imagePart.inline_data.data,
    mimeType: imagePart.inline_data.mime_type,
  };
}

"use server";

/**
 * Gemini AI Actions — Generación de contenido (Next.js Server Actions)
 * @see Fase 4 del plan maestro
 */

import { getCopyModel, generateWithRetry } from "@/lib/gemini";
import { COPY_SYSTEM_PROMPT } from "@/constants/prompts";
import type {
  GenerateCopyInput, GenerateCopyOutput, CopyVariant, Platform,
} from "@/types/content";

function buildCopyPrompt(objective: string, platform: Platform): string {
  return COPY_SYSTEM_PROMPT
    .replace("{PLATAFORMA}", platform === "both" ? "Facebook e Instagram" : platform)
    .replace("{OBJETIVO}", objective);
}

/**
 * Genera 3 variantes de copy para anuncios.
 */
export async function generateCopies(input: GenerateCopyInput): Promise<GenerateCopyOutput> {
  const model = getCopyModel();
  const promptText = buildCopyPrompt(input.objective, input.platform);

  const contentParts: any[] = [{ text: promptText }];
  if (input.referenceImage) {
    contentParts.push({
      inlineData: {
        data: input.referenceImage.base64,
        mimeType: input.referenceImage.mimeType,
      },
    });
  }

  const result = await model.generateContent(contentParts);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini no devolvió un JSON válido para los copies");

  const parsed = JSON.parse(jsonMatch[0]) as GenerateCopyOutput;
  if (!parsed.copies || !Array.isArray(parsed.copies) || parsed.copies.length === 0) {
    throw new Error("La respuesta de Gemini no contiene copies válidos");
  }
  return parsed;
}

/**
 * Chat libre con la IA — el usuario pregunta lo que quiera sobre marketing.
 */
export async function chatWithAI(
  message: string,
  referenceImage?: { base64: string; mimeType: string }
): Promise<string> {
  const model = getCopyModel();

  const systemContext = `Eres un experto en marketing digital para academias de idiomas. 
Tu nombre es WTII AI Assistant. Trabajas para "What Time Is It? Idiomas".
Responde siempre en español. Sé conciso, profesional y útil.
Si te piden crear contenido para redes sociales, genera textos persuasivos.
Si te piden analizar una imagen, descríbela y sugiere mejoras para usarla en anuncios.`;

  const contentParts: any[] = [{ text: `${systemContext}\n\nUsuario: ${message}` }];

  if (referenceImage) {
    contentParts.push({
      inlineData: {
        data: referenceImage.base64,
        mimeType: referenceImage.mimeType,
      },
    });
  }

  const result = await model.generateContent(contentParts);
  return result.response.text();
}

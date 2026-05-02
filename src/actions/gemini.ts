"use server";

/**
 * Gemini AI Actions — Generación de contenido (Next.js Server Actions)
 * @see Fase 4 del plan maestro
 */

import { getCopyModel, generateWithRetry } from "@/lib/gemini";
import { COPY_SYSTEM } from "@/constants/prompts";
import type {
  GenerateCopyInput, GenerateCopyOutput, CopyVariant, Platform,
} from "@/types/content";

function buildCopyPrompt(objective: string, platform: Platform): string {
  return COPY_SYSTEM
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

import * as googleTTS from "google-tts-api";

export type VideoScriptPart = {
  text: string;
  durationInFrames: number;
  audioUrl?: string;
};

export async function generateVideoScript(
  objective: string,
  referenceImage?: { base64: string; mimeType: string }
): Promise<VideoScriptPart[]> {
  const model = getCopyModel();

  const systemContext = `Eres un guionista experto para videos cortos en redes sociales (Reels, TikTok, Shorts).
Crea un guion visual de texto para un video promocional de "What Time Is It? Idiomas".
El video consiste en una imagen de fondo con textos animados que aparecen en secuencia.
Genera exactamente 3 o 4 partes.
Responde ÚNICAMENTE con un arreglo JSON válido con el siguiente formato, sin texto adicional:
[
  { "text": "Texto persuasivo y corto", "durationInFrames": 90 },
  ...
]
La duración (durationInFrames) debe estar entre 60 y 120 cuadros por texto (basado en 30fps, 60 = 2 segundos).
Si hay una imagen de referencia adjunta, haz que el texto se relacione con el contenido de la imagen.`;

  const contentParts: any[] = [{ text: `${systemContext}\n\nObjetivo del video: ${objective}` }];

  if (referenceImage) {
    contentParts.push({
      inlineData: {
        data: referenceImage.base64,
        mimeType: referenceImage.mimeType,
      },
    });
  }

  const result = await model.generateContent(contentParts);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gemini no devolvió un JSON válido para el guion del video");

  const parsedScript = JSON.parse(jsonMatch[0]) as VideoScriptPart[];

  // Generar audio TTS para cada parte
  for (const part of parsedScript) {
    try {
      const audioBase64 = await googleTTS.getAudioBase64(part.text, {
        lang: 'es',
        slow: false,
        host: 'https://translate.google.com',
      });
      part.audioUrl = `data:audio/mp3;base64,${audioBase64}`;
      
      // Calcular duración estimada basada en la longitud del texto
      // Asumimos un promedio de lectura de 2.5 palabras por segundo (aprox 12 frames por palabra)
      // + 30 frames extra (1 segundo) de pausa al final para que respire.
      const wordCount = part.text.split(" ").length;
      const estimatedFrames = Math.max(wordCount * 12 + 45, part.durationInFrames);
      part.durationInFrames = estimatedFrames;
    } catch (error) {
      console.warn("Error generating TTS for text:", part.text, error);
    }
  }

  return parsedScript;
}

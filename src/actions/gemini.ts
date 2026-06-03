"use server";

/**
 * Gemini AI Actions — Generación de contenido (Next.js Server Actions)
 * @see Fase 4 del plan maestro
 */

import { getCopyModel } from "@/lib/gemini";
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

import type { VideoScriptPart } from "@/types/content";
import { generateAudioBase64 } from "@/lib/tts";
import { generateImageWithGemini } from "@/lib/gemini";

export async function generateVideoScript(
  objective: string,
  referenceImage?: { base64: string; mimeType: string }
): Promise<VideoScriptPart[]> {
  const model = getCopyModel();

  const systemContext = `Eres un guionista y director creativo experto en anuncios publicitarios de alto impacto para redes sociales (Reels, TikTok, Shorts).

Tu tarea es crear un guion visual PUBLICITARIO profesional para "What Time Is It? Idiomas" (academia de inglés en Ixtlahuaca, México).

REGLAS DE ALTO IMPACTO PUBLICITARIO:
- El video debe contar una micro-historia con estructura: Gancho → Problema → Solución → Beneficio → Prueba Social → Urgencia → Llamado a la acción
- Cada escena debe tener un PROPÓSITO EMOCIONAL específico
- El lenguaje debe ser DIRECTO, COLOQUIAL MEXICANO, con poder de persuasión
- Usa preguntas retóricas, datos concretos y beneficios emocionales
- El tono debe ser ENERGÉTICO y DINÁMICO como un anuncio real de TV/Redes Sociales

Genera exactamente 6 o 7 escenas que fluyan como un comercial profesional.

SCENE TYPES (usa una secuencia lógica):
- "hook" → Gancho que atrapa atención en primeros 2 segundos (pregunta o dato impactante)
- "problem" → El dolor/ necesidad que resuelve el producto
- "solution" → Cómo la academia resuelve ese problema
- "benefit" → Beneficio principal transformacional
- "social-proof" → Prueba social (gente aprendiendo, resultados)
- "urgency" → Urgencia/ escasez (cupo limitado, promoción)
- "cta" → Llamado a la acción convincente

Responde ÚNICAMENTE con un arreglo JSON válido, sin texto adicional:
[
  {
    "text": "Texto persuasivo y conversacional (máximo 10 palabras)",
    "durationInFrames": 75,
    "sceneType": "hook",
    "emotion": "curiosidad | urgencia | deseo | confianza | felicidad | sorpresa | miedo | esperanza",
    "visualDescription": "Descripción visual de lo que debe mostrar esta escena",
    "backgroundPrompt": "Prompt detallado para generar imagen de fondo con IA para esta escena",
    "characterPose": "idle | talking | pointing | celebrating | waving",
    "characterPosition": "left | right | center"
  }
]

REGLAS:
- durationInFrames entre 60-90 frames (30fps, 60=2s, 90=3s)
- Texto MÁXIMO 10 palabras por escena (anuncios impactantes son cortos)
- sceneType debe tener una secuencia narrativa lógica
- characterPose debe coincidir con la emoción de la escena
- backgroundPrompt debe describir una escena visual generada por IA que refuerce el mensaje
- emotion describe el sentimiento que debe transmitir la escena`;

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

  // Generar audio TTS e imágenes de fondo para cada escena en paralelo
  const sceneTasks = parsedScript.map(async (part, index) => {
    const tasks: Promise<void>[] = [];

    // TTS
    tasks.push(
      (async () => {
        try {
          part.audioUrl = await generateAudioBase64(part.text);
          if (part.audioUrl) {
            const wordCount = part.text.split(" ").length;
            const audioFrames = wordCount * 18 + 75;
            part.durationInFrames = Math.max(audioFrames, part.durationInFrames);
          }
        } catch (error) {
          console.error(`[TTS] Error generando voz para escena ${index}: "${part.text}" =>`, error);
        }
      })()
    );

    // AI background image
    tasks.push(
      (async () => {
        try {
          const imagePrompt = `Genera una imagen de fondo vertical 1080x1920 para un video publicitario de una academia de inglés.
Mensaje de la escena: "${part.text}"
Emoción: ${part.emotion}
Escena tipo: ${part.sceneType}
Descripción visual: ${part.visualDescription}
Estilo: fotografía profesional, vibrante, juvenil, mexicano contemporáneo.
No incluyas texto en la imagen. Sin tipografía.`;
          const image = await generateImageWithGemini(imagePrompt, referenceImage);
          part.sceneImageUrl = `data:${image.mimeType};base64,${image.base64}`;
        } catch (error) {
          console.warn("Error generating background image for scene:", index, error);
        }
      })()
    );

    await Promise.all(tasks);
  });

  await Promise.all(sceneTasks);

  return parsedScript;
}

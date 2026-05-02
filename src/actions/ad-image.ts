"use server";

import { generateImageWithGemini } from "@/lib/gemini";
import { getAdAccountId } from "@/lib/meta";
import { IMAGE_PROMPT_SYSTEM } from "@/constants/prompts";

export interface GeneratedAdImage {
  base64: string;
  mimeType: string;
}

export interface UploadedAdImage {
  imageHash: string;
  url?: string;
}

/**
 * Genera una imagen publicitaria con Gemini AI basada en la estrategia de campaña.
 * Retorna la imagen en base64 para preview en el cliente.
 */
export async function generateAdImage(
  campaignName: string,
  headline: string,
  body: string,
  objective: string
): Promise<GeneratedAdImage> {
  const prompt = `${IMAGE_PROMPT_SYSTEM}

Contexto del anuncio:
- Campaña: "${campaignName}"
- Titular: "${headline}"
- Texto: "${body}"
- Objetivo: ${objective}
- Plataforma: Facebook/Instagram feed

Genera una imagen publicitaria profesional de 1080x1080 píxeles para este anuncio.
La imagen debe transmitir el mensaje del anuncio sin incluir texto.
Estilo: fotografía vibrante, moderna, que conecte con jóvenes mexicanos interesados en aprender inglés.
Ambiente: educativo pero dinámico y atractivo.
Colores: tonos cálidos y acogedores que representen aprendizaje y oportunidad.`;

  const result = await generateImageWithGemini(prompt);

  return {
    base64: result.base64,
    mimeType: result.mimeType,
  };
}

/**
 * Sube una imagen generada a Meta Ads como ad image.
 * Retorna el image_hash necesario para crear el ad creative.
 */
export async function uploadImageToMeta(
  imageBase64: string,
  mimeType: string
): Promise<UploadedAdImage> {
  const accountId = getAdAccountId();
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN no está configurado");
  }

  // Convertir base64 a Buffer para multipart upload
  const imageBuffer = Buffer.from(imageBase64, "base64");

  // Determinar extensión del archivo
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const fileName = `wtii_ad_${Date.now()}.${ext}`;

  // Crear FormData para multipart upload
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType });
  formData.append("filename", fileName);
  formData.append(fileName, blob, fileName);
  formData.append("access_token", accessToken);

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${accountId}/adimages`,
    {
      method: "POST",
      body: formData,
    }
  );

  const json = await response.json();

  if (!response.ok || json.error) {
    const errMsg =
      json?.error?.error_user_msg ||
      json?.error?.message ||
      `HTTP ${response.status}`;
    throw new Error(`Error al subir imagen a Meta: ${errMsg}`);
  }

  // La respuesta tiene formato: { images: { "filename": { hash: "...", url: "..." } } }
  const images = json?.images;
  if (!images) {
    throw new Error("Meta no devolvió información de la imagen subida");
  }

  // Obtener el hash del primer (y único) archivo subido
  const imageInfo = Object.values(images)[0] as { hash?: string; url?: string };
  if (!imageInfo?.hash) {
    throw new Error("Meta no devolvió el hash de la imagen");
  }

  return {
    imageHash: imageInfo.hash,
    url: imageInfo.url,
  };
}

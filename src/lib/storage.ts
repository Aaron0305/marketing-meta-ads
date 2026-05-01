/**
 * Supabase Storage — Operaciones con archivos
 * Utility de lib, no Server Action (no requiere "use server")
 * @see Fase 4 del plan maestro
 */

import { createServerClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

const CREATIVE_BUCKET = "creative-images";

export async function uploadCreativeImage(
  base64Data: string,
  mimeType: string
): Promise<{ imageUrl: string; imagePath: string }> {
  const supabase = createServerClient();
  const ext = mimeType.split("/")[1] || "png";
  const fileName = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(base64Data, "base64");

  const { error } = await supabase.storage
    .from(CREATIVE_BUCKET)
    .upload(fileName, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Error subiendo imagen: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(CREATIVE_BUCKET)
    .getPublicUrl(fileName);

  return { imageUrl: urlData.publicUrl, imagePath: fileName };
}

export async function deleteCreativeImage(imagePath: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.storage.from(CREATIVE_BUCKET).remove([imagePath]);
  if (error) console.error("[Storage] Error eliminando imagen:", error.message);
}

"use server";

import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { VideoScriptPart } from "./gemini";

export async function renderVideoToMp4(formData: FormData): Promise<string> {
  const imageSrc = formData.get("imageSrc") as string;
  const scriptJson = formData.get("script") as string;
  const durationInFramesStr = formData.get("durationInFrames") as string;
  
  const script: VideoScriptPart[] = JSON.parse(scriptJson);
  const durationInFrames = parseInt(durationInFramesStr, 10);
  // Asegurarnos de que existe el directorio de renders en public
  const publicDir = path.join(process.cwd(), "public", "renders");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const fileName = `video-${Date.now()}.mp4`;
  const outputLocation = path.join(publicDir, fileName);

  try {
    const entry = path.resolve(process.cwd(), "src", "remotion", "index.ts");
    
    console.log("[Render] Empaquetando composición de Remotion...");
    // El bundle puede tardar unos segundos
    const bundleLocation = await bundle({
      entryPoint: entry,
      webpackOverride: (config) => config,
    });

    console.log("[Render] Seleccionando composición MarketingVideo...");
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "MarketingVideo",
      inputProps: { imageSrc, script },
    });

    // Sobrescribir la duración por defecto (150) con la duración calculada real
    composition.durationInFrames = durationInFrames;

    console.log(`[Render] Renderizando MP4 (${durationInFrames} frames)... esto puede tomar un poco.`);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation,
      inputProps: { imageSrc, script },
    });

    console.log("[Render] Completado con éxito en:", outputLocation);
    // Devolver la ruta relativa pública
    return `/renders/${fileName}`;
  } catch (err: any) {
    console.error("[Render Error]", err);
    throw new Error("Fallo al renderizar el video: " + err.message);
  }
}

import GeneratorForm from "@/components/content/generator-form";
import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Generador de Contenido IA — WTII Marketing",
  description: "Genera copies e imágenes para tus anuncios con Google Gemini",
};

/**
 * AI Content Generator Page — Módulo 3: Generador de contenido IA
 * @see Fase 4 del plan maestro
 */
export default async function ContentGeneratorPage() {
  const session = await getCurrentSession();
  
  // Como tenemos bypass en el middleware, si no hay sesión real, mockeamos un ID para guardar en DB
  const userId = session?.userId || "00000000-0000-0000-0000-000000000000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Generador de Contenido IA</h1>
        <p className="text-white/50 mt-1">
          Crea copies persuasivos e imágenes de alto impacto en segundos utilizando Google Gemini.
        </p>
      </div>

      <GeneratorForm userId={userId} />
    </div>
  );
}

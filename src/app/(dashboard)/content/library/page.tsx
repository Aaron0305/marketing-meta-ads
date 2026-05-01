export const metadata = {
  title: "Biblioteca de Creativos — WTII Marketing",
  description: "Galería de imágenes y copies generados, listos para usar en anuncios",
};

/**
 * Creative Library Page — Módulo 4: Biblioteca de creativos
 *
 * Galería de todos los creativos generados y subidos.
 * Filtros por tipo, fecha, plataforma.
 * Acciones: usar en anuncio, descargar, eliminar.
 *
 * @see Fase 5 del plan maestro
 */
export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca de Creativos</h1>
          <p className="text-foreground/60">
            Tus imágenes y copies listos para usar
          </p>
        </div>
      </div>

      {/* TODO: Fase 5 — Filtros: tipo, fecha, plataforma */}
      <div className="flex gap-3 flex-wrap">
        {/* Placeholder para filtros */}
      </div>

      {/* TODO: Fase 5 — Grid de creativos con acciones */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <p className="text-foreground/40 text-sm col-span-full text-center py-12">
          Los creativos generados aparecerán aquí
        </p>
      </section>
    </div>
  );
}

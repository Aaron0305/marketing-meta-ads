import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eliminación de Datos — WTII Marketing",
  description: "Procedimiento para solicitar eliminación de datos en WTII Marketing.",
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#0b0b12] text-white">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-bold">Eliminación de Datos de Usuario</h1>
        <p className="mt-2 text-sm text-white/60">
          Última actualización: 01 de mayo de 2026
        </p>

        <section className="mt-8 space-y-4 text-sm leading-7 text-white/85">
          <p>
            Si deseas eliminar tus datos personales de WTII Marketing, envía una
            solicitud al correo:
            {" "}
            <a
              href="mailto:englishscool@gmail.com"
              className="text-cyan-300 underline underline-offset-2"
            >
              englishscool@gmail.com
            </a>
            .
          </p>
          <p>Incluye en tu mensaje:</p>
          <ul className="list-disc space-y-1 pl-5 text-white/80">
            <li>Asunto: "Eliminar datos".</li>
            <li>Correo de la cuenta registrada.</li>
            <li>Nombre de la cuenta o negocio (opcional).</li>
          </ul>
          <p>
            Procesaremos tu solicitud en un plazo máximo de 72 horas hábiles,
            salvo obligación legal de conservar cierta información por más tiempo.
          </p>
        </section>
      </div>
    </main>
  );
}

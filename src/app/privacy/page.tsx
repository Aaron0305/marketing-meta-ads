import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — WTII Marketing",
  description: "Política de privacidad de WTII Marketing.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b0b12] text-white">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-bold">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-white/60">
          Última actualización: 01 de mayo de 2026
        </p>

        <section className="mt-8 space-y-4 text-sm leading-7 text-white/85">
          <p>
            En WTII Marketing respetamos tu privacidad. Esta política explica
            cómo recopilamos, usamos y protegemos tu información cuando usas
            nuestra plataforma.
          </p>
          <p>
            Recopilamos datos de cuenta (como correo electrónico), datos de uso
            de la plataforma y, cuando el usuario lo autoriza, datos necesarios
            para integraciones con terceros como Meta.
          </p>
          <p>
            Usamos la información para operar y mejorar el servicio, crear y
            gestionar campañas publicitarias, y brindar soporte técnico.
          </p>
          <p>
            No vendemos información personal. Solo compartimos datos con
            proveedores necesarios para operar el servicio, bajo medidas de
            seguridad razonables.
          </p>
          <p>
            Puedes solicitar acceso, corrección o eliminación de tus datos
            siguiendo el procedimiento indicado en la página de eliminación de
            datos.
          </p>
          <p>
            Si tienes dudas sobre esta política, contáctanos en{" "}
            <a
              href="mailto:englishscool@gmail.com"
              className="text-cyan-300 underline underline-offset-2"
            >
              englishscool@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

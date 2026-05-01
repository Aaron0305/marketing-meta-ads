import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

/**
 * Dashboard Layout
 *
 * Layout principal para todas las páginas protegidas del sistema.
 * Incluye sidebar de navegación y barra superior.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        {/* Contenedor con scroll para las páginas */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

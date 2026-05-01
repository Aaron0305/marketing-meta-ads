"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // Mapear rutas a títulos para la barra superior
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard General";
    if (pathname.startsWith("/campaigns/new")) return "Crear Campaña";
    if (pathname.startsWith("/campaigns")) return "Gestión de Campañas";
    if (pathname === "/content") return "Generador IA (Copies & Imágenes)";
    if (pathname === "/content/library") return "Biblioteca de Creativos";
    return "Panel de Control";
  };

  return (
    <header className="h-16 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-8">
      <div>
        <h2 className="text-lg font-semibold text-white tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Bar (Simulada por ahora) */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-64 pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Notificaciones */}
        <button className="relative text-white/60 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        </button>

        {/* Avatar Usuario */}
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white leading-none">Admin</p>
            <p className="text-[11px] text-white/50 mt-1">What Time Is It?</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
              <span className="text-xs font-bold text-white">AD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

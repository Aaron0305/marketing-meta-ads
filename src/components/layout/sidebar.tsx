"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Megaphone, 
  Sparkles, 
  Library, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { signOut } from "@/actions/auth";

const MENU_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Campañas Meta", icon: Megaphone, href: "/campaigns" },
  { name: "Generador IA", icon: Sparkles, href: "/content" },
  { name: "Biblioteca", icon: Library, href: "/content/library" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-[#0a0a0a] border-r border-white/10 shrink-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-sm">⏰</span>
          </div>
          <span className="text-white font-bold tracking-tight text-[15px]">
            WTII Marketing
          </span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
        <div className="px-3 mb-2">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Menú Principal
          </p>
        </div>

        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-purple-500/10 text-purple-400" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={isActive ? "text-purple-400" : "text-white/40 group-hover:text-white/70 transition-colors"} />
                <span className="font-medium text-[14px]">{item.name}</span>
              </div>
              {isActive && (
                <ChevronRight size={16} className="text-purple-400/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area (Settings & Logout) */}
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200">
          <Settings size={18} className="text-white/40" />
          <span className="font-medium text-[14px]">Configuración</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 mt-1"
        >
          <LogOut size={18} className="text-red-400/50" />
          <span className="font-medium text-[14px]">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

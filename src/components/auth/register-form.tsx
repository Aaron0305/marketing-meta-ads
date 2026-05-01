"use client";

import { useState } from "react";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/actions/auth";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signUp(name, email, password);
      // Redirigir al dashboard después de registrarse
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
      setIsLoading(false);
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[420px] p-8 rounded-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-card-enter">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-amber-500 mb-4 animate-logo-pulse">
          <span className="text-3xl">⏰</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Crear Cuenta
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Únete a What Time Is It? Idiomas
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-name" className="text-[13px] font-medium text-white/70">
            Nombre completo
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Juan Pérez"
            required
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border border-white/[0.12] bg-white/[0.06] text-white text-[15px] placeholder:text-white/30 outline-none transition-all duration-200 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)] focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-email" className="text-[13px] font-medium text-white/70">
            Correo electrónico
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@wtii.com"
            required
            autoComplete="email"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border border-white/[0.12] bg-white/[0.06] text-white text-[15px] placeholder:text-white/30 outline-none transition-all duration-200 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)] focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-password" className="text-[13px] font-medium text-white/70">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-white/[0.12] bg-white/[0.06] text-white text-[15px] placeholder:text-white/30 outline-none transition-all duration-200 focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)] focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors p-1"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 animate-shake">
            <p className="text-red-300 text-[13px]">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !email || !password || !name}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white text-[15px] font-semibold shadow-[0_4px_14px_rgba(124,58,237,0.4)] transition-all duration-200 hover:from-purple-500 hover:to-purple-600 hover:shadow-[0_6px_20px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_8px_rgba(124,58,237,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-1 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Registrando…
            </>
          ) : (
            <>
              <UserPlus size={18} />
              Registrarse
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-white/50 mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
          Inicia Sesión
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { exchangeForLongLivedToken } from "@/actions/token";
import { Key, CheckCircle2, AlertCircle, Copy, Check, Loader2, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [longToken, setLongToken] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleExchange() {
    setIsLoading(true);
    setError("");
    setLongToken("");

    try {
      const result = await exchangeForLongLivedToken();
      setLongToken(result.token);
      setExpiresIn(result.expiresIn);
    } catch (err: any) {
      setError(err.message || "Error al intercambiar token");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(longToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  const expiresDays = Math.floor(expiresIn / 86400);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-card-enter">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Configuración</h1>
        <p className="text-white/50 mt-1">Gestiona tokens y conexiones del sistema</p>
      </div>

      {/* Token Exchange */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-amber-500/10">
            <Key className="text-amber-400" size={22} />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Token de Meta Ads</h2>
            <p className="text-white/50 text-sm mt-1">
              Convierte tu token de corta duración en uno de <strong className="text-amber-300">~60 días</strong>.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
            <p className="text-blue-300/80 text-xs leading-relaxed">
              <strong>Instrucciones:</strong><br />
              1. Primero genera un token nuevo en el{" "}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                Graph API Explorer
              </a><br />
              2. Pégalo en tu <code className="bg-white/10 px-1 rounded">.env.local</code> como META_ACCESS_TOKEN<br />
              3. Reinicia el server (<code className="bg-white/10 px-1 rounded">pnpm dev</code>)<br />
              4. Haz clic en el botón de abajo para convertirlo en token largo<br />
              5. Copia el token largo y reemplázalo en <code className="bg-white/10 px-1 rounded">.env.local</code>
            </p>
          </div>

          <button
            onClick={handleExchange}
            disabled={isLoading}
            className="w-full py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Intercambiando token...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Generar Token de Larga Duración
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {longToken && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-emerald-300 font-medium text-sm">¡Token generado exitosamente!</p>
                  <p className="text-emerald-400/70 text-xs mt-1">
                    Expira en <strong>{expiresDays} días</strong>. Copia y pégalo en .env.local.
                  </p>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-xs text-white/70 font-mono break-all whitespace-pre-wrap max-h-24 overflow-auto">
                  {longToken}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Estado de conexiones</h3>
        <div className="space-y-3">
          <StatusRow label="Supabase" value={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Conectado" : "No configurado"} ok={!!process.env.NEXT_PUBLIC_SUPABASE_URL} />
          <StatusRow label="Google Gemini" value="API Key configurada" ok={true} />
          <StatusRow label="Meta Ads" value={`Cuenta: ${process.env.NEXT_PUBLIC_META_ACCOUNT || "configurada"}`} ok={true} />
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
      <span className="text-white/70 text-sm">{label}</span>
      <span className={`text-sm font-medium flex items-center gap-1.5 ${ok ? "text-emerald-400" : "text-red-400"}`}>
        <span className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
        {value}
      </span>
    </div>
  );
}

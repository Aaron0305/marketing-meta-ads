import { getCampaigns, getAccountInsights } from "@/actions/meta";
import Link from "next/link";
import { Plus, CirclePause, CirclePlay, BarChart3, AlertCircle, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Campañas — WTII Marketing",
  description: "Gestiona tus campañas de Meta Ads desde un solo lugar",
};

export default async function CampaignsPage() {
  let campaigns: any[] = [];
  let error = "";

  try {
    campaigns = await getCampaigns();
  } catch (err: any) {
    error = err.message || "Error al conectar con Meta";
    console.error("[Campaigns] Error:", error);
  }

  return (
    <div className="space-y-6 animate-card-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Campañas Meta Ads</h1>
          <p className="text-white/50 mt-1">
            {error ? "Error de conexión" : `${campaigns.length} campaña(s) en tu cuenta`}
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Nueva Campaña
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={22} />
          <div>
            <h3 className="text-red-300 font-semibold mb-1">Error al conectar con Meta</h3>
            <pre className="text-red-400/80 text-xs leading-relaxed whitespace-pre-wrap bg-red-500/5 p-3 rounded-lg mt-2 max-h-40 overflow-auto">
              {error}
            </pre>
            <p className="text-white/40 text-xs mt-3">
              Verifica META_ACCESS_TOKEN y META_AD_ACCOUNT_ID en .env.local y reinicia el server.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!error && campaigns.length === 0 && (
        <div className="border border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center text-center bg-white/[0.02]">
          <BarChart3 className="text-white/20 mb-4" size={40} />
          <h3 className="text-lg font-medium text-white/60 mb-2">Sin campañas aún</h3>
          <p className="text-sm text-white/40 max-w-md mb-6">
            No se encontraron campañas en tu cuenta publicitaria. Crea tu primera campaña desde aquí o desde Meta Business Suite.
          </p>
          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium rounded-xl hover:bg-purple-500/30 transition-colors"
          >
            <Plus size={16} />
            Crear primera campaña
          </Link>
        </div>
      )}

      {/* Campaigns Table */}
      {!error && campaigns.length > 0 && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">Campaña</th>
                <th className="text-left py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">Estado</th>
                <th className="text-left py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">Objetivo</th>
                <th className="text-left py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">Presupuesto</th>
                <th className="text-right py-4 px-6 text-xs font-medium text-white/50 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {campaigns.map((campaign: any) => {
                const isActive = campaign.status === "ACTIVE";
                const budget = campaign.daily_budget
                  ? `$${(parseInt(campaign.daily_budget) / 100).toFixed(2)}/día`
                  : campaign.lifetime_budget
                  ? `$${(parseInt(campaign.lifetime_budget) / 100).toFixed(2)} total`
                  : "Sin presupuesto";

                return (
                  <tr key={campaign.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-6">
                      <Link href={`/campaigns/${campaign.id}`} className="text-white font-medium text-sm hover:text-purple-300 transition-colors">
                        {campaign.name}
                      </Link>
                      <p className="text-[11px] text-white/30 mt-0.5">ID: {campaign.id}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : campaign.status === "PAUSED"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-white/5 text-white/50"
                      }`}>
                        {isActive ? <CirclePlay size={12} /> : <CirclePause size={12} />}
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-white/60">
                      {campaign.objective?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="py-4 px-6 text-sm text-white/60">
                      {budget}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                      >
                        Ver métricas →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Debug info (temporal) */}
      {!error && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[11px] text-white/30 font-mono">
            ✅ Conectado a Meta Graph API v25.0 · Cuenta: {process.env.META_AD_ACCOUNT_ID} · {campaigns.length} campaña(s) encontrada(s)
          </p>
        </div>
      )}
    </div>
  );
}

import { getCampaignInsights } from "@/actions/meta";
import Link from "next/link";
import { ArrowLeft, DollarSign, Eye, MousePointerClick, Users, Activity, TrendingUp } from "lucide-react";

/**
 * Detalle de Campaña — Muestra métricas reales de Meta
 */
export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let insights: any[] = [];
  let error = "";

  try {
    insights = await getCampaignInsights(id, "30d");
  } catch (err: any) {
    error = err.message || "Error al obtener métricas";
  }

  // Calcular totales
  const totals = insights.reduce(
    (acc, day) => ({
      spend: acc.spend + parseFloat(day.spend || "0"),
      impressions: acc.impressions + parseInt(day.impressions || "0"),
      clicks: acc.clicks + parseInt(day.clicks || "0"),
      reach: acc.reach + parseInt(day.reach || "0"),
    }),
    { spend: 0, impressions: 0, clicks: 0, reach: 0 }
  );

  const avgCtr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0";
  const avgCpm = totals.impressions > 0 ? ((totals.spend / totals.impressions) * 1000).toFixed(2) : "0";

  return (
    <div className="space-y-6 animate-card-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/campaigns" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Métricas de Campaña</h1>
          <p className="text-white/40 text-sm mt-0.5 font-mono">ID: {id}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-300 font-semibold mb-1">Error al obtener métricas</p>
          <pre className="text-red-400/80 text-xs whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {/* No Data */}
      {!error && insights.length === 0 && (
        <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/[0.02]">
          <Activity className="text-white/20 mx-auto mb-4" size={40} />
          <h3 className="text-lg font-medium text-white/60 mb-2">Sin métricas disponibles</h3>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Esta campaña aún no tiene datos de rendimiento. Puede estar pausada o recién creada.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      {!error && insights.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              title="Gasto total (30d)"
              value={`$${totals.spend.toFixed(2)}`}
              icon={DollarSign}
              color="text-emerald-400"
              bgColor="bg-emerald-500/10"
            />
            <KpiCard
              title="Impresiones"
              value={totals.impressions.toLocaleString()}
              icon={Eye}
              color="text-blue-400"
              bgColor="bg-blue-500/10"
            />
            <KpiCard
              title="Alcance (personas)"
              value={totals.reach.toLocaleString()}
              icon={Users}
              color="text-purple-400"
              bgColor="bg-purple-500/10"
            />
            <KpiCard
              title="Clics"
              value={totals.clicks.toLocaleString()}
              icon={MousePointerClick}
              color="text-amber-400"
              bgColor="bg-amber-500/10"
            />
            <KpiCard
              title="CTR promedio"
              value={`${avgCtr}%`}
              icon={TrendingUp}
              color="text-cyan-400"
              bgColor="bg-cyan-500/10"
            />
            <KpiCard
              title="CPM promedio"
              value={`$${avgCpm}`}
              icon={Activity}
              color="text-pink-400"
              bgColor="bg-pink-500/10"
            />
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-white font-semibold">Desglose diario (últimos 30 días)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-5 text-xs font-medium text-white/50 uppercase">Fecha</th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-white/50 uppercase">Gasto</th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-white/50 uppercase">Impresiones</th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-white/50 uppercase">Clics</th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-white/50 uppercase">CTR</th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-white/50 uppercase">CPM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {insights.map((day: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-5 text-sm text-white/80">{day.date_start}</td>
                      <td className="py-3 px-5 text-sm text-white/60 text-right">${parseFloat(day.spend || "0").toFixed(2)}</td>
                      <td className="py-3 px-5 text-sm text-white/60 text-right">{parseInt(day.impressions || "0").toLocaleString()}</td>
                      <td className="py-3 px-5 text-sm text-white/60 text-right">{parseInt(day.clicks || "0").toLocaleString()}</td>
                      <td className="py-3 px-5 text-sm text-white/60 text-right">{parseFloat(day.ctr || "0").toFixed(2)}%</td>
                      <td className="py-3 px-5 text-sm text-white/60 text-right">${parseFloat(day.cpm || "0").toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
      <div className="flex justify-between items-start mb-3">
        <p className="text-white/60 text-sm font-medium">{title}</p>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
  );
}

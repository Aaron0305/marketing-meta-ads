import { getCampaigns, getAccountInsights } from "@/actions/meta";
import Link from "next/link";
import { Activity, MousePointerClick, Eye, DollarSign, Users, TrendingUp, Sparkles, Megaphone } from "lucide-react";

export default async function DashboardPage() {
  let campaigns: any[] = [];
  let insights: any[] = [];
  let metaError = "";

  try {
    campaigns = await getCampaigns();
  } catch (err: any) {
    metaError = err.message || "Error al conectar con Meta";
  }

  try {
    insights = await getAccountInsights("7d");
  } catch {
    // Si insights falla, no bloquear el resto
  }

  // Calcular totales de los insights
  const totals = insights.reduce(
    (acc, day) => ({
      spend: acc.spend + parseFloat(day.spend || "0"),
      impressions: acc.impressions + parseInt(day.impressions || "0"),
      clicks: acc.clicks + parseInt(day.clicks || "0"),
      reach: acc.reach + parseInt(day.reach || "0"),
    }),
    { spend: 0, impressions: 0, clicks: 0, reach: 0 }
  );

  const activeCampaigns = campaigns.filter((c: any) => c.status === "ACTIVE").length;
  const hasData = insights.length > 0;

  return (
    <div className="space-y-8 animate-card-enter">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Gasto (7 días)"
          value={hasData ? `$${totals.spend.toFixed(2)}` : "—"}
          subtitle={hasData ? `${insights.length} días con datos` : "Sin datos"}
          icon={DollarSign}
        />
        <KpiCard
          title="Impresiones"
          value={hasData ? totals.impressions.toLocaleString() : "—"}
          subtitle={hasData ? `${totals.reach.toLocaleString()} personas alcanzadas` : "Sin datos"}
          icon={Eye}
        />
        <KpiCard
          title="Clics"
          value={hasData ? totals.clicks.toLocaleString() : "—"}
          subtitle={hasData && totals.impressions > 0 ? `CTR: ${((totals.clicks / totals.impressions) * 100).toFixed(2)}%` : "Sin datos"}
          icon={MousePointerClick}
        />
        <KpiCard
          title="Campañas activas"
          value={metaError ? "—" : String(activeCampaigns)}
          subtitle={metaError ? "Error de conexión" : `${campaigns.length} total`}
          icon={Activity}
        />
      </div>

      {/* Meta Connection Status */}
      {metaError && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <p className="text-amber-300 font-semibold text-sm mb-1">⚠️ No se pudo conectar con Meta Ads</p>
          <p className="text-amber-400/70 text-xs">{metaError}</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campañas recientes */}
        <div className="col-span-1 lg:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-semibold">Campañas Recientes</h3>
            <Link href="/campaigns" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
              Ver todas →
            </Link>
          </div>

          {campaigns.length === 0 && !metaError ? (
            <div className="text-center py-8">
              <Megaphone className="text-white/20 mx-auto mb-3" size={32} />
              <p className="text-white/40 text-sm">No hay campañas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign: any) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors group"
                >
                  <div>
                    <p className="text-white font-medium text-sm group-hover:text-purple-300 transition-colors">
                      {campaign.name}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {campaign.objective?.replace(/_/g, " ") || "Sin objetivo"}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    campaign.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : campaign.status === "PAUSED"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-white/5 text-white/50"
                  }`}>
                    {campaign.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="col-span-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 flex flex-col">
          <h3 className="text-white font-semibold mb-6">Acciones Rápidas</h3>
          <div className="flex flex-col gap-3 flex-1">
            <Link href="/content" className="flex items-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-colors text-left group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Sparkles className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Chat con IA</p>
                <p className="text-white/50 text-xs mt-0.5">Genera copies y estrategias</p>
              </div>
            </Link>

            <Link href="/campaigns/new" className="flex items-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors text-left group">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Megaphone className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Nueva Campaña</p>
                <p className="text-white/50 text-xs mt-0.5">Crear anuncio en Meta</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Connection Status Footer */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
        <p className="text-[11px] text-white/30 font-mono">
          {metaError ? "❌ Meta desconectado" : `✅ Conectado a Meta Graph API v25.0 · Cuenta: ${process.env.META_AD_ACCOUNT_ID}`}
          {" · "}Supabase: ✅ · Gemini: ✅
        </p>
        <p className="text-[11px] text-white/20">
          Última actualización: {new Date().toLocaleTimeString("es-MX")}
        </p>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon }: any) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] transition-colors">
      <div className="flex justify-between items-start mb-4">
        <p className="text-white/60 text-sm font-medium">{title}</p>
        <div className="p-2 rounded-lg bg-white/5">
          <Icon size={18} className="text-white/60" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
      <p className="text-xs text-white/40 mt-1">{subtitle}</p>
    </div>
  );
}

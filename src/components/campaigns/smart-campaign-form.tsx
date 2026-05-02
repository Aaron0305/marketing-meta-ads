"use client";

import { useState } from "react";
import {
  Sparkles, Loader2, CheckCircle2, ArrowLeft,
  Target, Users, DollarSign, Copy, Check, Rocket,
  Lightbulb, MapPin, Calendar, Megaphone, AlertCircle, ImageIcon, Upload, type LucideIcon
} from "lucide-react";
import {
  generateCampaignStrategy,
  publishCampaign,
  type CampaignStrategy,
  type PublishResult,
} from "@/actions/smart-campaign";
import { uploadImageToMeta } from "@/actions/ad-image";

type Step = "input" | "review" | "publishing" | "done";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function SmartCampaignForm() {
  const [step, setStep] = useState<Step>("input");
  const [objective, setObjective] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [strategy, setStrategy] = useState<CampaignStrategy | null>(null);
  const [selectedCopy, setSelectedCopy] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [link, setLink] = useState("");
  const [adImageBase64, setAdImageBase64] = useState<string | null>(null);
  const [adImageMime, setAdImageMime] = useState<string>("image/png");
  const [imageError, setImageError] = useState("");

  // ── Paso 1: Generar estrategia con IA ──
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!objective.trim() || isLoading) return;

    setIsLoading(true);
    setError("");
    setStrategy(null);

    try {
      const result = await generateCampaignStrategy(objective);
      setStrategy(result);
      setSelectedCopy(result.recommendedCopyIndex ?? 0);
      setStep("review");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al generar la estrategia"));
    } finally {
      setIsLoading(false);
    }
  }

  // ── Leer imagen localmente ──
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImageError("La imagen no debe superar los 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const [header, base64] = result.split(',');
      const mime = header.split(':')[1].split(';')[0];
      setAdImageBase64(base64);
      setAdImageMime(mime);
      setImageError("");
    };
    reader.onerror = () => {
      setImageError("Error al leer el archivo");
    };
    reader.readAsDataURL(file);
  }

  // ── Paso 2: Publicar en Meta ──
  async function handlePublish() {
    if (!strategy || isLoading) return;

    setIsLoading(true);
    setError("");
    setStep("publishing");

    try {
      // Subir imagen a Meta si fue generada
      let imageHash: string | undefined;
      if (adImageBase64) {
        try {
          const uploaded = await uploadImageToMeta(adImageBase64, adImageMime);
          imageHash = uploaded.imageHash;
        } catch (err: unknown) {
          console.warn("No se pudo subir la imagen, publicando sin imagen:", err);
        }
      }

      const result = await publishCampaign(strategy, selectedCopy, link || undefined, imageHash);
      if (!result.ok) {
        setError(result.error || "Error al publicar la campaña en Meta");
        setStep("review");
        return;
      }
      setPublishResult(result.data);
      setStep("done");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al publicar la campaña en Meta"));
      setStep("review");
    } finally {
      setIsLoading(false);
    }
  }

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-card-enter">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { key: "input", label: "Describe", icon: Sparkles },
          { key: "review", label: "Revisa", icon: Target },
          { key: "publishing", label: "Publica", icon: Rocket },
          { key: "done", label: "¡Listo!", icon: CheckCircle2 },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full justify-center ${
              step === s.key
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : (["input", "review", "publishing", "done"].indexOf(step) > i)
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-white/[0.04] text-white/30"
            }`}>
              <s.icon size={16} />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < 3 && <div className="w-4 h-px bg-white/10 mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      {/* ═══════════ STEP 1: INPUT ═══════════ */}
      {step === "input" && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-white" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Campaña Inteligente con IA</h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Describe qué quieres promocionar y nuestra IA creará una estrategia completa con audiencia, 
              presupuesto y textos optimizados para tu academia.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="max-w-xl mx-auto space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">¿Qué quieres promocionar?</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder='Ej: "Quiero llenar las inscripciones de verano, ofrecemos 2x1 en cursos de inglés para jóvenes de 15 a 25 años"'
                className="w-full h-36 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-purple-500/50 transition-all"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Enlace de destino (opcional)</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://tu-pagina.com/inscripciones"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <MapPin className="text-blue-400 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-blue-300/80">
                Tu anuncio se mostrará en un radio de <strong>15 km alrededor de Ixtlahuaca</strong>, 
                Estado de México. La IA optimizará edad, intereses y plataforma.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !objective.trim()}
              className="w-full py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Gemini está analizando tu objetivo...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generar Estrategia con IA
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ═══════════ STEP 2: REVIEW ═══════════ */}
      {step === "review" && strategy && (
        <div className="space-y-6">
          {/* Strategy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              icon={Target}
              title="Objetivo"
              value={strategy.objective.replace("OUTCOME_", "")}
              detail={strategy.reasonObjective}
              color="text-purple-400"
              bg="bg-purple-500/10"
            />
            <InfoCard
              icon={DollarSign}
              title="Presupuesto"
              value={`$${(strategy.dailyBudget / 100).toFixed(0)} MXN/día`}
              detail={`${strategy.duration} días · Total: $${((strategy.dailyBudget / 100) * strategy.duration).toFixed(0)} MXN`}
              color="text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <InfoCard
              icon={Users}
              title="Audiencia"
              value={`${strategy.targeting.ageMin}-${strategy.targeting.ageMax} años`}
              detail={strategy.targeting.reasonTargeting}
              color="text-blue-400"
              bg="bg-blue-500/10"
            />
          </div>

          {/* Geo & Duration */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white/60">
              <MapPin size={12} className="text-amber-400" /> 15 km · Ixtlahuaca, Edomex
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white/60">
              <Calendar size={12} className="text-blue-400" /> {strategy.duration} días de duración
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white/60">
              <Megaphone size={12} className="text-purple-400" /> {strategy.platform === "both" ? "Facebook + Instagram" : strategy.platform}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Hipótesis</p>
              <p className="text-white/80 text-sm">{strategy.hypothesis}</p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">KPI Esperado</p>
              <p className="text-white/80 text-sm">
                {strategy.expectedKpi.metric}: {strategy.expectedKpi.targetValue}
              </p>
              <p className="text-white/50 text-xs mt-1">{strategy.expectedKpi.reason}</p>
            </div>
          </div>

          {/* Copies */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Copy size={18} className="text-amber-400" />
              Elige el texto para tu anuncio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {strategy.copies.map((copy, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCopy(i)}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    selectedCopy === i
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      selectedCopy === i ? "bg-purple-500/30 text-purple-300" : "bg-white/10 text-white/50"
                    }`}>
                      Opción {i + 1} · Score {copy.score?.total ?? "-"}
                    </span>
                    {selectedCopy === i && <CheckCircle2 size={16} className="text-purple-400" />}
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-2">{copy.headline}</h4>
                  <p className="text-white/70 text-sm leading-relaxed mb-3">{copy.body}</p>
                  <span className="inline-block px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 text-xs font-medium">
                    CTA: {copy.cta}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Imagen del Anuncio ── */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-pink-400" />
              Imagen del Anuncio
            </h3>

            {!adImageBase64 && (
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 flex items-center justify-center mb-4">
                  <ImageIcon className="text-pink-400" size={28} />
                </div>
                <p className="text-white/50 text-sm mb-4 max-w-sm">
                  Sube una imagen para acompañar tu anuncio. Se subirá automáticamente a Meta al publicar la campaña.
                </p>
                <label className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer">
                  <Upload size={16} />
                  Subir Imagen
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </label>
              </div>
            )}

            {adImageBase64 && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20">
                  <img
                    src={`data:${adImageMime};base64,${adImageBase64}`}
                    alt="Imagen seleccionada para el anuncio"
                    className="w-full max-h-[400px] object-contain mx-auto"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Lista para subir
                  </div>
                </div>
                <div className="flex gap-3">
                  <label className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/70 text-sm font-medium rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                    <Upload size={14} />
                    Cambiar imagen
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                  <button
                    onClick={() => { setAdImageBase64(null); setImageError(""); }}
                    className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )}

            {imageError && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {imageError}
              </div>
            )}
          </div>

          {/* Tips */}
          {strategy.tips?.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5">
              <h4 className="text-amber-300 font-semibold text-sm mb-3 flex items-center gap-2">
                <Lightbulb size={16} />
                Tips de la IA
              </h4>
              <ul className="space-y-2">
                {strategy.tips.map((tip, i) => (
                  <li key={i} className="text-amber-300/70 text-sm flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Error al publicar</p>
                <p className="text-red-400/80 text-xs">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => { setStep("input"); setStrategy(null); setAdImageBase64(null); setImageError(""); }}
              className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} />
              Modificar
            </button>
            <button
              onClick={handlePublish}
              disabled={isLoading}
              className="flex-[2] py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Rocket size={18} />
              )}
              Publicar en Meta Ads
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 3: PUBLISHING ═══════════ */}
      {step === "publishing" && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="animate-spin text-purple-400" size={36} />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Publicando tu campaña...</h2>
          <div className="space-y-3 max-w-sm mx-auto">
            <PublishStep label="Creando campaña en Meta..." active />
            <PublishStep label="Configurando audiencia (15km Ixtlahuaca)" />
            {adImageBase64 && <PublishStep label="Subiendo imagen del anuncio" />}
            <PublishStep label="Agregando textos del anuncio" />
            <PublishStep label="Activando campaña" />
          </div>
        </div>
      )}

      {/* ═══════════ STEP 4: DONE ═══════════ */}
      {step === "done" && publishResult && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-emerald-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Campaña creada exitosamente!</h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Tu campaña fue creada en modo <strong className="text-amber-400">PAUSADA</strong> para que puedas revisarla 
            en Meta Business Suite antes de activarla.
          </p>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 max-w-md mx-auto mb-8 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Campaign ID</span>
                <button onClick={() => copyText(publishResult.campaignId, "campaign")} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  {copiedField === "campaign" ? <Check size={12} /> : <Copy size={12} />}
                  {publishResult.campaignId}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Ad Set ID</span>
                <span className="text-sm text-white/70 font-mono">{publishResult.adSetId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Ad ID</span>
                <span className="text-sm text-white/70 font-mono">{publishResult.adId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Estado</span>
                <span className="text-amber-400 text-sm font-medium">{publishResult.status}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 max-w-md mx-auto">
            <button
              onClick={() => { setStep("input"); setStrategy(null); setPublishResult(null); setObjective(""); setAdImageBase64(null); setImageError(""); }}
              className="flex-1 py-3 px-4 bg-white/5 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Crear otra campaña
            </button>
            <a
              href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${process.env.NEXT_PUBLIC_META_AD_ACCOUNT_NUM || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium rounded-xl hover:bg-blue-500/30 transition-colors text-sm text-center"
            >
              Ver en Meta →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function InfoCard({ icon: Icon, title, value, detail, color, bg }: { 
  icon: LucideIcon; title: string; value: string; detail: string; color: string; bg: string 
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        <Icon size={20} className={color} />
      </div>
      <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
      <h4 className="text-white font-bold text-lg mb-1">{value}</h4>
      <p className="text-white/40 text-xs leading-relaxed">{detail}</p>
    </div>
  );
}

function PublishStep({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-sm ${active ? "text-purple-300" : "text-white/30"}`}>
      {active ? <Loader2 size={14} className="animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20" />}
      {label}
    </div>
  );
}

"use server";

import { generateWithRetry } from "@/lib/gemini";
import { metaFetch, getAdAccountId } from "@/lib/meta";
import { 
  CAMPAIGN_REVIEW_SYSTEM, 
  buildReviewUserTurn, 
  CAMPAIGN_STRATEGY_V2_SYSTEM, 
  buildStrategyUserTurn 
} from "@/constants/prompts";

export interface CampaignStrategy {
  campaignName: string;
  objective: string;
  reasonObjective: string;
  hypothesis: string;
  segments: {
    primary: string;
    secondary: string;
  };
  creativeAngle: string;
  riskLevel: "low" | "medium" | "high";
  expectedKpi: {
    metric: "CTR" | "CPC" | "CPL" | "CPM";
    targetValue: number;
    reason: string;
  };
  dailyBudget: number;
  duration: number;
  reasonBudget: string;
  targeting: {
    ageMin: number;
    ageMax: number;
    genders: number[];
    interests: { id: string; name: string }[];
    reasonTargeting: string;
  };
  copies: {
    headline: string;
    body: string;
    cta: string;
    linkDescription: string;
    score: {
      clarity: number;
      intent: number;
      ctrPotential: number;
      total: number;
    };
  }[];
  platform: "facebook" | "instagram" | "both";
  tips: string[];
  recommendedCopyIndex: number;
}

export interface PublishResult {
  campaignId: string;
  adSetId: string;
  adId: string;
  status: string;
}

export type PublishCampaignResponse =
  | { ok: true; data: PublishResult }
  | { ok: false; error: string };

class MetaApiError extends Error {
  code?: number;
  subcode?: number;
  userMessage?: string;

  constructor(message: string, opts?: { code?: number; subcode?: number; userMessage?: string }) {
    super(message);
    this.name = "MetaApiError";
    this.code = opts?.code;
    this.subcode = opts?.subcode;
    this.userMessage = opts?.userMessage;
  }
}

const IXTLAHUACA_GEO = {
  latitude: 19.5686,
  longitude: -99.7682,
  radius: 15,
  distance_unit: "kilometer" as const,
};

const OBJECTIVES = [
  "OUTCOME_REACH",
  "OUTCOME_TRAFFIC",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_LEADS",
] as const;
const VALID_CTAS = ["LEARN_MORE", "SIGN_UP", "CONTACT_US", "SEND_MESSAGE"] as const;
const KPI_METRICS = ["CTR", "CPC", "CPL", "CPM"] as const;
const RISK_LEVELS = ["low", "medium", "high"] as const;
const PLATFORM_VALUES = ["facebook", "instagram", "both"] as const;

type CampaignObjective = (typeof OBJECTIVES)[number];

const BUDGET_LIMITS_BY_OBJECTIVE: Record<CampaignObjective, { min: number; max: number }> = {
  OUTCOME_REACH: { min: 5000, max: 40000 },
  OUTCOME_TRAFFIC: { min: 7000, max: 80000 },
  OUTCOME_ENGAGEMENT: { min: 7000, max: 70000 },
  OUTCOME_LEADS: { min: 10000, max: 120000 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function truncate(value: string, max: number): string {
  const clean = String(value || "").trim();
  return clean.length <= max ? clean : `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function textValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function isObjective(value: string): value is CampaignObjective {
  return OBJECTIVES.includes(value as CampaignObjective);
}

function extractJsonObject(responseText: string): Record<string, unknown> {
  const raw = responseText.trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? raw;
  try {
    return JSON.parse(fenced);
  } catch {
    const start = fenced.indexOf("{");
    const end = fenced.lastIndexOf("}");
    if (start === -1 || end === -1 || start >= end) {
      throw new Error("Gemini no devolvió JSON válido");
    }
    return JSON.parse(fenced.slice(start, end + 1));
  }
}

function scoreCopy(copy: {
  headline: string;
  body: string;
  cta: string;
  linkDescription: string;
}) {
  const text = `${copy.headline} ${copy.body} ${copy.linkDescription}`.toLowerCase();
  const ctaBoost = ["SIGN_UP", "SEND_MESSAGE"].includes(copy.cta) ? 12 : 6;
  const urgencyBoost = /(hoy|ahora|últimos|cupo|inscríbete|inscripciones)/.test(text) ? 10 : 0;
  const localBoost = /(ixtlahuaca|edomex|estado de méxico)/.test(text) ? 8 : 0;

  const clarity = clamp(100 - Math.abs(copy.body.length - 95) - Math.abs(copy.headline.length - 28), 40, 100);
  const intent = clamp(ctaBoost + urgencyBoost + localBoost + 55, 40, 100);
  const ctrPotential = clamp(Math.round(clarity * 0.4 + intent * 0.6), 40, 100);
  const total = Math.round(clarity * 0.35 + intent * 0.35 + ctrPotential * 0.3);

  return { clarity, intent, ctrPotential, total };
}

async function buildBusinessMemory(): Promise<string> {
  try {
    const accountId = getAdAccountId();
    type Campaign = { id: string; name?: string; objective?: string; status?: string };
    type MetaResponse<T> = { data?: T[] };
    type Insight = { ctr?: string; cpm?: string; spend?: string; clicks?: string };

    const campaignResponse = await metaFetch<MetaResponse<Campaign>>(`/${accountId}/campaigns`, {
      params: {
        fields: "id,name,objective,status",
        limit: "10",
      },
    });
    const campaigns = (campaignResponse.data || []).slice(0, 5);

    if (!campaigns.length) {
      return "Sin historial suficiente. Priorizar experimentación controlada.";
    }

    const summaries: string[] = [];
    for (const campaign of campaigns) {
      try {
        const insightResp = await metaFetch<MetaResponse<Insight>>(`/${campaign.id}/insights`, {
          params: {
            fields: "spend,clicks,ctr,cpm",
            date_preset: "last_30d",
            limit: "1",
          },
        });
        const insight = insightResp.data?.[0];
        const ctr = Number(insight?.ctr || 0);
        const clicks = Number(insight?.clicks || 0);
        const cpm = Number(insight?.cpm || 0);
        if (Number.isFinite(ctr) && ctr > 0) {
          summaries.push(
            `- ${campaign.name || campaign.id}: objetivo=${campaign.objective || "N/A"}, CTR=${ctr.toFixed(2)}%, clicks=${clicks || 0}, CPM=$${cpm.toFixed(2)}`
          );
        }
      } catch {
        // Ignorar campañas con error parcial para mantener el flujo principal.
      }
    }

    if (!summaries.length) {
      return "Histórico disponible sin métricas útiles. Recomendar baseline de CTR y prueba A/B.";
    }

    return `Campañas recientes con señales de rendimiento:\n${summaries.join("\n")}`;
  } catch {
    return "No fue posible leer historial de campañas. Usar estrategia conservadora y validación continua.";
  }
}

function normalizeCampaignStrategy(raw: Record<string, unknown>): CampaignStrategy {
  const rawTargeting =
    raw.targeting && typeof raw.targeting === "object" ? (raw.targeting as Record<string, unknown>) : {};
  const rawExpectedKpi =
    raw.expectedKpi && typeof raw.expectedKpi === "object" ? (raw.expectedKpi as Record<string, unknown>) : {};
  const rawSegments =
    raw.segments && typeof raw.segments === "object" ? (raw.segments as Record<string, unknown>) : {};

  const objectiveRaw = typeof raw.objective === "string" ? raw.objective : "";
  const objective: CampaignObjective = isObjective(objectiveRaw) ? objectiveRaw : "OUTCOME_TRAFFIC";
  const budgetLimits = BUDGET_LIMITS_BY_OBJECTIVE[objective];

  const ageMin = clamp(Number(rawTargeting.ageMin || 18), 18, 65);
  const ageMax = clamp(Number(rawTargeting.ageMax || ageMin), ageMin, 65);
  const genders =
    Array.isArray(rawTargeting.genders) && rawTargeting.genders.length
      ? rawTargeting.genders.filter((g: unknown) => [0, 1, 2].includes(Number(g))).map(Number)
      : [0];
  const platformValue = typeof raw.platform === "string" ? raw.platform : "";
  const platform: CampaignStrategy["platform"] = PLATFORM_VALUES.includes(platformValue as (typeof PLATFORM_VALUES)[number])
    ? (platformValue as CampaignStrategy["platform"])
    : "both";
  const riskValue = typeof raw.riskLevel === "string" ? raw.riskLevel : "";
  const riskLevel: CampaignStrategy["riskLevel"] = RISK_LEVELS.includes(riskValue as (typeof RISK_LEVELS)[number])
    ? (riskValue as CampaignStrategy["riskLevel"])
    : "medium";
  const metricValue = typeof rawExpectedKpi.metric === "string" ? rawExpectedKpi.metric : "";
  const metric: CampaignStrategy["expectedKpi"]["metric"] = KPI_METRICS.includes(
    metricValue as (typeof KPI_METRICS)[number]
  )
    ? (metricValue as CampaignStrategy["expectedKpi"]["metric"])
    : "CTR";
  const duration = clamp(Number(raw.duration || 7), 3, 30);
  const dailyBudget = clamp(Number(raw.dailyBudget || budgetLimits.min), budgetLimits.min, budgetLimits.max);

  const rawCopyList = Array.isArray(raw.copies) ? raw.copies : [];
  const sourceCopies = rawCopyList as Array<Record<string, unknown>>;
  const normalizedCopies = sourceCopies.slice(0, 3).map((copy) => {
    const ctaValue = typeof copy?.cta === "string" ? copy.cta : "";
    const cta = VALID_CTAS.includes(ctaValue as (typeof VALID_CTAS)[number]) ? ctaValue : "LEARN_MORE";
    const normalized = {
      headline: truncate(typeof copy?.headline === "string" ? copy.headline : "Aprende inglés en Ixtlahuaca", 40),
      body: truncate(
        typeof copy?.body === "string" ? copy.body : "Inscríbete hoy y mejora tu inglés con clases dinámicas.",
        125
      ),
      cta,
      linkDescription: truncate(typeof copy?.linkDescription === "string" ? copy.linkDescription : "Cupos limitados", 30),
    };
    return { ...normalized, score: scoreCopy(normalized) };
  });

  while (normalizedCopies.length < 3) {
    const fallback = {
      headline: truncate(`Inglés práctico opción ${normalizedCopies.length + 1}`, 40),
      body: "Da el siguiente paso en tu inglés. Reserva tu lugar hoy en WTII Idiomas.",
      cta: "LEARN_MORE",
      linkDescription: "Inscripciones abiertas",
    };
    normalizedCopies.push({ ...fallback, score: scoreCopy(fallback) });
  }

  const recommendedCopyIndex =
    normalizedCopies
      .map((copy, index) => ({ index, score: copy.score.total }))
      .sort((a, b) => b.score - a.score)[0]?.index ?? 0;

  return {
    campaignName: truncate(textValue(raw.campaignName, "Campaña IA WTII"), 80),
    objective,
    reasonObjective: truncate(textValue(raw.reasonObjective, "Objetivo balanceado para escalar resultados."), 180),
    hypothesis: truncate(
      textValue(raw.hypothesis, "Si usamos mensaje local y oferta clara, aumentará el interés de registro."),
      220
    ),
    segments: {
      primary: truncate(textValue(rawSegments.primary, "Jóvenes 18-30 en Ixtlahuaca con interés en idiomas."), 180),
      secondary: truncate(
        textValue(rawSegments.secondary, "Padres de adolescentes interesados en educación complementaria."),
        180
      ),
    },
    creativeAngle: truncate(textValue(raw.creativeAngle, "Beneficio inmediato + prueba social local."), 180),
    riskLevel,
    expectedKpi: {
      metric,
      targetValue: clamp(Number(rawExpectedKpi.targetValue || 1.5), 0.1, 200),
      reason: truncate(textValue(rawExpectedKpi.reason, "Benchmark inicial para campañas locales de educación."), 180),
    },
    dailyBudget,
    duration,
    reasonBudget: truncate(
      textValue(raw.reasonBudget, "Presupuesto suficiente para fase de aprendizaje sin sobreexponer audiencia."),
      180
    ),
    targeting: {
      ageMin,
      ageMax,
      genders: genders.length ? genders : [0],
      interests: Array.isArray(rawTargeting.interests)
        ? (rawTargeting.interests as Array<Record<string, unknown>>)
            .filter(
              (item): item is { id: string; name: string } =>
                Boolean(item) && typeof item.id === "string" && typeof item.name === "string"
            )
            .slice(0, 5)
        : [],
      reasonTargeting: truncate(textValue(rawTargeting.reasonTargeting, "Segmentación por cercanía y afinidad educativa."), 180),
    },
    copies: normalizedCopies,
    platform,
    tips: Array.isArray(raw.tips)
      ? raw.tips.slice(0, 3).map((tip: string) => truncate(String(tip), 120))
      : [
          "Monitorea CTR y CPC cada 48 horas.",
          "Escala solo el copy con mejor tracción.",
          "Renueva creativos si frecuencia sube.",
        ],
    recommendedCopyIndex,
  };
}

export async function generateCampaignStrategy(objective: string): Promise<CampaignStrategy> {
  if (!objective?.trim()) {
    throw new Error("Debes escribir el objetivo de la campaña");
  }

  const businessMemory = await buildBusinessMemory();
  const strategistPrompt = `${CAMPAIGN_STRATEGY_V2_SYSTEM}\n\n${buildStrategyUserTurn(objective, businessMemory)}`;

  const strategistResponse = await generateWithRetry(strategistPrompt);
  const strategistJson = extractJsonObject(strategistResponse);

  const reviewPrompt = `${CAMPAIGN_REVIEW_SYSTEM}\n\n${buildReviewUserTurn(JSON.stringify(strategistJson), businessMemory)}`;

  const reviewedResponse = await generateWithRetry(reviewPrompt);
  const reviewedJson = extractJsonObject(reviewedResponse);
  return normalizeCampaignStrategy(reviewedJson);
}

export async function publishCampaign(
  strategy: CampaignStrategy,
  selectedCopyIndex: number = 0,
  link?: string,
  imageHash?: string
): Promise<PublishCampaignResponse> {
  const normalizedStrategy = normalizeCampaignStrategy(strategy as unknown as Record<string, unknown>);
  const accountId = getAdAccountId();
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    return { ok: false, error: "META_ACCESS_TOKEN no está configurado" };
  }

  const safeSelectedIndex =
    Number.isInteger(selectedCopyIndex) &&
    selectedCopyIndex >= 0 &&
    selectedCopyIndex < normalizedStrategy.copies.length
      ? selectedCopyIndex
      : normalizedStrategy.recommendedCopyIndex;
  const copy = normalizedStrategy.copies[safeSelectedIndex] || normalizedStrategy.copies[0];
  const META_BASE = "https://graph.facebook.com/v25.0";
  const token = accessToken;

  async function metaPost<T>(path: string, data: Record<string, string>): Promise<T> {
    const body = new URLSearchParams({ ...data, access_token: token });
    const response = await fetch(`${META_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const json = await response.json();
    if (!response.ok || json.error) {
      const err = json?.error || {};
      const msg = err?.error_user_msg || err?.message || `HTTP ${response.status}`;
      throw new MetaApiError(`Meta API: ${msg}`, {
        code: err?.code,
        subcode: err?.error_subcode,
        userMessage: err?.error_user_msg,
      });
    }
    return json as T;
  }

  async function resolveValidPageId(): Promise<string | undefined> {
    const configuredPageId = process.env.META_PAGE_ID?.trim();
    const numericConfiguredPageId =
      configuredPageId && /^\d+$/.test(configuredPageId) ? configuredPageId : undefined;

    try {
      type PagesResponse = { data?: Array<{ id?: string; name?: string }> };
      const pages = await metaFetch<PagesResponse>("/me/accounts", { params: { limit: "25" } });
      const pageIds = new Set((pages?.data || []).map((p) => p.id).filter((id): id is string => Boolean(id)));

      if (numericConfiguredPageId && pageIds.has(numericConfiguredPageId)) {
        return numericConfiguredPageId;
      }

      const candidate = pages?.data?.find((p) => p?.id && /^\d+$/.test(p.id));
      if (candidate?.id) return candidate.id;
    } catch {
      return numericConfiguredPageId;
    }

    return numericConfiguredPageId;
  }

  async function assertPageIdIsUsable(pageId: string): Promise<void> {
    try {
      type PageResponse = { id?: string };
      const page = await metaFetch<PageResponse>(`/${pageId}`, { params: { fields: "id,name" } });
      if (!page?.id) throw new Error("No page id in response");
    } catch {
      throw new MetaApiError(
        `Meta API: El META_PAGE_ID (${pageId}) no es accesible con el token actual.`,
        {
          userMessage:
            "El META_PAGE_ID no es accesible con este token/app. Verifica permisos y conexión de la página.",
        }
      );
    }
  }

  try {
    const campaignResult = await metaPost<{ id: string }>(`/${accountId}/campaigns`, {
      name: normalizedStrategy.campaignName,
      objective: normalizedStrategy.objective,
      status: "PAUSED",
      special_ad_categories: "[]",
      is_adset_budget_sharing_enabled: "false",
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + normalizedStrategy.duration);
    if (endDate <= startDate) {
      throw new MetaApiError("Meta API: Fecha de término inválida para la campaña");
    }

    const targeting = {
      age_min: normalizedStrategy.targeting.ageMin,
      age_max: normalizedStrategy.targeting.ageMax,
      genders: normalizedStrategy.targeting.genders,
      targeting_automation: { advantage_audience: 0 },
      geo_locations: {
        custom_locations: [
          {
            latitude: IXTLAHUACA_GEO.latitude,
            longitude: IXTLAHUACA_GEO.longitude,
            radius: IXTLAHUACA_GEO.radius,
            distance_unit: IXTLAHUACA_GEO.distance_unit,
          },
        ],
      },
    };

    const optimizationGoal =
      normalizedStrategy.objective === "OUTCOME_REACH"
        ? "REACH"
        : normalizedStrategy.objective === "OUTCOME_ENGAGEMENT"
          ? "POST_ENGAGEMENT"
          : normalizedStrategy.objective === "OUTCOME_LEADS"
            ? "LEAD_GENERATION"
            : "LINK_CLICKS";
    const bidStrategy = "LOWEST_COST_WITHOUT_CAP";

    let adSetResult: { id: string };
    try {
      adSetResult = await metaPost<{ id: string }>(`/${accountId}/adsets`, {
        name: `${normalizedStrategy.campaignName} - AdSet`,
        campaign_id: campaignResult.id,
        daily_budget: String(normalizedStrategy.dailyBudget),
        billing_event: "IMPRESSIONS",
        optimization_goal: optimizationGoal,
        bid_strategy: bidStrategy,
        targeting: JSON.stringify(targeting),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: "PAUSED",
      });
    } catch (error) {
      if (error instanceof MetaApiError && error.code === 100 && error.subcode === 1870227) {
        adSetResult = await metaPost<{ id: string }>(`/${accountId}/adsets`, {
          name: `${normalizedStrategy.campaignName} - AdSet`,
          campaign_id: campaignResult.id,
          daily_budget: String(normalizedStrategy.dailyBudget),
          billing_event: "IMPRESSIONS",
          optimization_goal: optimizationGoal,
          bid_strategy: bidStrategy,
          targeting: JSON.stringify({
            ...targeting,
            targeting_automation: { advantage_audience: 1 },
          }),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          status: "PAUSED",
        });
      } else if (error instanceof MetaApiError && error.code === 100 && error.subcode === 2490487) {
        const fallbackBidAmount = String(Math.max(100, Math.floor(normalizedStrategy.dailyBudget * 0.2)));
        adSetResult = await metaPost<{ id: string }>(`/${accountId}/adsets`, {
          name: `${normalizedStrategy.campaignName} - AdSet`,
          campaign_id: campaignResult.id,
          daily_budget: String(normalizedStrategy.dailyBudget),
          billing_event: "IMPRESSIONS",
          optimization_goal: optimizationGoal,
          bid_strategy: "LOWEST_COST_WITH_BID_CAP",
          bid_amount: fallbackBidAmount,
          targeting: JSON.stringify(targeting),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          status: "PAUSED",
        });
      } else {
        throw error;
      }
    }

    const normalizedPageId = await resolveValidPageId();
    if (!normalizedPageId) {
      throw new MetaApiError(
        "Meta API: No se encontró una página válida para el anuncio.",
        {
          userMessage:
            "Configura META_PAGE_ID con un ID numérico de página autorizado en tu Business Manager.",
        }
      );
    }
    await assertPageIdIsUsable(normalizedPageId);

    const allowedCTAs = new Set([
      "BOOK_TRAVEL", "CONTACT_US", "DONATE", "DONATE_NOW", "DOWNLOAD", "GET_DIRECTIONS", "GO_LIVE", "INTERESTED", "LEARN_MORE", "SEE_DETAILS", "LIKE_PAGE", "MESSAGE_PAGE", "RAISE_MONEY", "SAVE", "SEND_TIP", "SHOP_NOW", "SIGN_UP", "VIEW_INSTAGRAM_PROFILE", "INSTAGRAM_MESSAGE", "LOYALTY_LEARN_MORE", "PURCHASE_GIFT_CARDS", "PAY_TO_ACCESS", "SEE_MORE", "TRY_IN_CAMERA", "WHATSAPP_LINK", "GET_IN_TOUCH", "TRY_NOW", "ASK_A_QUESTION", "START_A_CHAT", "CHAT_NOW", "ASK_US", "CHAT_WITH_US", "BOOK_NOW", "CHECK_AVAILABILITY", "ORDER_NOW", "WHATSAPP_MESSAGE", "GET_MOBILE_APP", "INSTALL_MOBILE_APP", "USE_MOBILE_APP", "INSTALL_APP", "USE_APP", "PLAY_GAME", "TRY_DEMO", "WATCH_VIDEO", "WATCH_MORE", "OPEN_LINK", "NO_BUTTON", "LISTEN_MUSIC", "MOBILE_DOWNLOAD", "GET_OFFER", "GET_OFFER_VIEW", "BUY_NOW", "BUY_TICKETS", "UPDATE_APP", "BET_NOW", "ADD_TO_CART", "SELL_NOW", "GET_SHOWTIMES", "LISTEN_NOW", "GET_EVENT_TICKETS", "REMIND_ME", "SEARCH_MORE", "PRE_REGISTER", "SWIPE_UP_PRODUCT", "SWIPE_UP_SHOP", "PLAY_GAME_ON_FACEBOOK", "VISIT_WORLD", "OPEN_INSTANT_APP", "JOIN_GROUP", "GET_PROMOTIONS", "SEND_UPDATES", "INQUIRE_NOW", "VISIT_PROFILE", "CHAT_ON_WHATSAPP", "EXPLORE_MORE", "CONFIRM", "JOIN_CHANNEL", "MAKE_AN_APPOINTMENT", "ASK_ABOUT_SERVICES", "BOOK_A_CONSULTATION", "GET_A_QUOTE", "BUY_VIA_MESSAGE", "ASK_FOR_MORE_INFO", "VIEW_PRODUCT", "VIEW_CHANNEL", "WATCH_LIVE_VIDEO", "IMAGINE", "CALL", "MISSED_CALL", "CALL_NOW", "CALL_ME", "APPLY_NOW", "BUY", "GET_QUOTE", "SUBSCRIBE", "RECORD_NOW", "VOTE_NOW", "GIVE_FREE_RIDES", "REGISTER_NOW", "OPEN_MESSENGER_EXT", "EVENT_RSVP", "CIVIC_ACTION", "SEND_INVITES", "REFER_FRIENDS", "REQUEST_TIME", "SEE_MENU", "SEARCH", "TRY_IT", "TRY_ON", "LINK_CARD", "DIAL_CODE", "FIND_YOUR_GROUPS", "START_ORDER"
    ]);

    let finalCta = (copy.cta || "LEARN_MORE").toUpperCase();
    if (finalCta === "SEND_MESSAGE") finalCta = "MESSAGE_PAGE";
    if (!allowedCTAs.has(finalCta)) finalCta = "LEARN_MORE";

    const linkData: Record<string, unknown> = {
      message: copy.body,
      link: link || "https://www.facebook.com",
      name: copy.headline,
      description: copy.linkDescription || "",
      call_to_action: { type: finalCta },
    };

    // Agregar imagen si fue generada por IA
    if (imageHash) {
      linkData.image_hash = imageHash;
    }

    const adCreativeResult = await metaPost<{ id: string }>(`/${accountId}/adcreatives`, {
      name: `${normalizedStrategy.campaignName} - Creative`,
      object_story_spec: JSON.stringify({
        page_id: normalizedPageId,
        link_data: linkData,
      }),
    });

    const adResult = await metaPost<{ id: string }>(`/${accountId}/ads`, {
      name: `${normalizedStrategy.campaignName} - Ad`,
      adset_id: adSetResult.id,
      creative: JSON.stringify({ creative_id: adCreativeResult.id }),
      status: "PAUSED",
    });

    return {
      ok: true,
      data: {
        campaignId: campaignResult.id,
        adSetId: adSetResult.id,
        adId: adResult.id,
        status: "PAUSED",
      },
    };
  } catch (error) {
    const msg =
      error instanceof MetaApiError
        ? error.userMessage || error.message
        : error instanceof Error
          ? error.message
          : "Error desconocido al publicar en Meta";
    return { ok: false, error: msg };
  }
}

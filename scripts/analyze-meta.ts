import { GoogleGenerativeAI } from "@google/generative-ai";

// Las variables de entorno serán cargadas automáticamente desde tu .env.local al ejecutar el script
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!META_ACCESS_TOKEN || !AD_ACCOUNT_ID || !GOOGLE_GEMINI_API_KEY) {
  console.error("❌ Faltan variables de entorno. Asegúrate de estar ejecutando el script con --env-file=.env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);

async function fetchMetaInsights() {
  // Construimos la URL de la Graph API para obtener las estadísticas de la cuenta de anuncios
  const url = new URL(`https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/insights`);
  
  // Parámetros: datos de los últimos 30 días, agrupados por campaña
  url.searchParams.append('access_token', META_ACCESS_TOKEN as string);
  url.searchParams.append('level', 'campaign');
  url.searchParams.append('fields', 'campaign_name,spend,impressions,clicks,cpc,cpm,actions');
  url.searchParams.append('date_preset', 'last_30d');

  console.log("⏳ Descargando estadísticas desde Meta Ads Graph API...");
  
  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      console.error(`❌ Error de Meta Ads API: ${data.error.message}`);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("❌ Error de red al conectar con Meta:", error);
    return null;
  }
}

async function analyzeWithAI(insightsData: any) {
  if (!insightsData || insightsData.length === 0) {
    return "No hay datos recientes (últimos 30 días) en Meta Ads para analizar. O no has invertido presupuesto recientemente.";
  }

  console.log(`✅ Datos descargados con éxito. Se encontraron ${insightsData.length} campañas activas o con gasto.`);
  console.log("🧠 Enviando información a Gemini para análisis estratégico...");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
  Eres un auditor financiero estricto de Meta Ads. Analiza estos datos y entrega un reporte ULTRA CONCISO y numéricamente exacto. CERO RELLENO. No saludes.
  Los "Leads" son el valor de 'onsite_conversion.total_messaging_connection' o similar dentro de 'actions'. Si no hay 'actions', los Leads son 0.
  Calcula el Costo/Lead dividiendo el 'spend' entre los Leads.

  Devuelve exactamente esta estructura:

  🚨 APAGAR INMEDIATAMENTE (Cero leads y gastando)
  - [Campaña] | Gasto: $[X] | Leads: [X] | Costo/Lead: $[X] | CPC: $[X] | CPM: $[X] | Causa: [1 frase corta]

  ✅ ESCALAR HOY (Las que sí traen leads baratos)
  - [Campaña] | Gasto: $[X] | Leads: [X] | Costo/Lead: $[X] | CPC: $[X] | CPM: $[X] | Motivo: [1 frase corta]

  ⚠️ ALERTA DE COSTOS EXCESIVOS
  - [Campaña]: CPM de $[X] (Causa probable: Audiencia saturada) o CPC de $[X] (Causa probable: Mal anuncio).

  🎯 INSTRUCCIÓN QUIRÚRGICA:
  - [1 sola acción directa basada en los números, ej: "Mueve el presupuesto de X a Y"].
  
  Datos crudos de Meta Ads (JSON):
  ${JSON.stringify(insightsData, null, 2)}
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("❌ Error al procesar la información con Gemini:", error);
    return null;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("📊 SCRIPT DE ANÁLISIS ESTRATÉGICO DE META ADS 📊");
  console.log("=".repeat(60));

  const insightsData = await fetchMetaInsights();
  
  if (insightsData) {
    const analysis = await analyzeWithAI(insightsData);
    if (analysis) {
      console.log("\n" + "=".repeat(17) + " DIAGNÓSTICO SENIOR " + "=".repeat(17) + "\n");
      console.log(analysis);
      console.log("\n" + "=".repeat(54));
    }
  }
}

main();

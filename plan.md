# PLAN MAESTRO — Sistema de Marketing Digital con IA
## What Time Is It? Idiomas — v3.0

> **Stack**: Next.js 16 (App Router) · Supabase · Meta Graph API v25.0 · Google Gemini 2.5 Flash  
> **Autor del plan**: Estrada — Freelance Dev  
> **Última actualización**: 01 Mayo 2026

---

## PROGRESO ACTUAL

### ✅ FASE 1 — Setup + Auth + Estructura (COMPLETADA)

- [x] Proyecto Next.js 16 con App Router + TypeScript + Tailwind v4
- [x] Base de datos Supabase (users, creative_assets, metrics_cache)
- [x] Supabase Auth con email/password (login + registro)
- [x] Middleware de protección de rutas con cookie
- [x] Login y Register con diseño Glassmorphism
- [x] Layout del dashboard con Sidebar + Header premium
- [x] Variables de entorno configuradas (Supabase + Gemini + Meta)
- [x] Storage bucket (creative-images) creado

### ✅ FASE 2 — Dashboard de métricas (COMPLETADA)

- [x] Cliente Meta Graph API v25.0 (`lib/meta.ts`)
- [x] Server Actions para insights y campañas (`actions/meta.ts`)
- [x] Conexión real con Meta Ads (token + ad account)
- [x] Dashboard con KPIs reales (Gasto, Impresiones, Clics, Campañas activas)
- [x] Lista de campañas recientes en dashboard
- [x] Estado de conexión visible (Meta ✅, Supabase ✅, Gemini ✅)
- [ ] Gráfica de rendimiento con recharts
- [ ] Selector de rango de fechas

### ✅ FASE 3 — Gestión de campañas (PARCIAL)

- [x] Página de lista de campañas con datos reales
- [x] Tabla con nombre, estado, objetivo, presupuesto
- [x] Página de detalle con métricas por campaña (KPIs + desglose diario)
- [x] API Routes funcionando (campaigns, adsets, ads, insights)
- [ ] Formulario para crear campaña nueva
- [ ] Pausar/activar campaña desde el sistema

### ✅ FASE 4 — Generador IA (PARCIAL)

- [x] Chat libre con Gemini 2.5 Flash
- [x] Generación de 3 variantes de copy
- [x] Subida de imagen de referencia para análisis visual
- [x] Interfaz de tabs (Chat IA + Generar Copies)
- [ ] ~~Generación de imágenes~~ (API Imagen requiere endpoint diferente)

### 🔲 FASE 5 — Biblioteca de creativos (PENDIENTE)
### 🔲 FASE 6 — Pulido y deploy (PENDIENTE)

---

## ⭐ FASE 7 — NUEVA: Campañas Inteligentes con IA (SIGUIENTE)

> **Objetivo**: Crear campañas optimizadas para maximizar visualizaciones
> usando Gemini como cerebro estratégico + Meta API para ejecución automática.

### Flujo completo:

```
Usuario describe su promoción en lenguaje natural
        ↓
Gemini analiza y genera:
  1. Estrategia de targeting (edad, ubicación, intereses)
  2. 3 variantes de copy optimizados
  3. Recomendación de presupuesto y duración
  4. Objetivo de campaña óptimo
        ↓
Sistema muestra preview del anuncio completo
        ↓
Usuario aprueba → Se crea en Meta automáticamente:
  - Campaña con objetivo optimizado
  - Ad Set con audiencia inteligente
  - Ad con el copy seleccionado
        ↓
Dashboard muestra rendimiento en tiempo real
```

### Tasks Fase 7:

- [ ] Server Action: `analyzeAndSuggest()` — Gemini analiza objetivo y genera estrategia completa
- [ ] Formulario inteligente: usuario solo describe qué quiere promocionar
- [ ] Preview de anuncio antes de publicar (cómo se verá en Facebook/Instagram)
- [ ] Publicación automática en Meta (campaign → adset → ad en un click)
- [ ] Recomendaciones de mejora para campañas existentes

---

## ARQUITECTURA ACTUAL

```
src/
├── actions/              ← Server Actions ("use server")
│   ├── auth.ts           ✅
│   ├── gemini.ts         ✅
│   ├── meta.ts           ✅
│   └── creative.ts       ✅
├── app/
│   ├── (auth)/
│   │   ├── login/        ✅
│   │   └── register/     ✅
│   ├── (dashboard)/
│   │   ├── layout.tsx    ✅ (Sidebar + Header)
│   │   ├── page.tsx      ✅ (Dashboard con KPIs reales)
│   │   ├── campaigns/
│   │   │   ├── page.tsx  ✅ (Lista real de Meta)
│   │   │   ├── new/      🔲 (Formulario pendiente)
│   │   │   └── [id]/     ✅ (Métricas por campaña)
│   │   └── content/
│   │       ├── page.tsx  ✅ (Chat IA + Copy Generator)
│   │       └── library/  🔲 (Biblioteca pendiente)
│   └── api/              ✅ (Todos los routes creados)
├── components/
│   ├── layout/           ✅ (sidebar + header)
│   ├── auth/             ✅ (login-form + register-form)
│   └── content/          ✅ (generator-form)
├── lib/                  ✅ (gemini, meta, supabase, storage, utils)
├── constants/            ✅ (meta, prompts)
├── types/                ✅ (content, meta)
└── middleware.ts          ✅
```

---

*Plan v3.0 — Con conexión Meta real verificada*
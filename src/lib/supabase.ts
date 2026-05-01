/**
 * Supabase Client Configuration
 *
 * Exporta el cliente de Supabase para uso en el proyecto.
 *
 * Variables de entorno requeridas:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * @see Fase 1 del plan maestro
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Crea un cliente de Supabase.
 * Usa la Publishable Key (permisos controlados por RLS).
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no están configurados");
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Cliente para uso en Server Components y Server Actions.
 * Mismo key pero sin persistir sesión (no hay cookies en server).
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no están configurados");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

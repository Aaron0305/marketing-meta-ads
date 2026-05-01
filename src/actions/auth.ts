"use server";

/**
 * Auth Actions — Autenticación y autorización (Next.js Server Actions)
 * @see Fase 1 del plan maestro
 */

import { createServerClient } from "@/lib/supabase";
import type { AppUser, UserRole } from "@/types/content";
import { cookies } from "next/headers";

export async function signUp(name: string, email: string, password: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: { name }
    }
  });
  
  if (error) throw new Error(`Error de registro: ${error.message}`);
  
  // Temporal: Seteamos una cookie para que el middleware te deje pasar y explorar
  const cookieStore = await cookies();
  cookieStore.set("wtii_session", "true", { path: "/" });

  return { success: true };
}

export async function signIn(email: string, password: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Error de autenticación: ${error.message}`);
  if (!data.user) throw new Error("No se pudo obtener el usuario");

  // Temporal: Seteamos una cookie para que el middleware te deje pasar y explorar
  const cookieStore = await cookies();
  cookieStore.set("wtii_session", "true", { path: "/" });

  return { userId: data.user.id, email: data.user.email || email };
}

export async function signOut() {
  const supabase = createServerClient();
  const { error } = await supabase.auth.signOut();
  
  const cookieStore = await cookies();
  cookieStore.delete("wtii_session");

  if (error) throw new Error(`Error al cerrar sesión: ${error.message}`);
}

export async function getCurrentSession() {
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { userId: user.id, email: user.email || "" };
}

export async function getUserProfile(userId: string): Promise<AppUser | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("users").select("*").eq("id", userId).single();
  if (error || !data) return null;
  return data as AppUser;
}

export async function hasRole(userId: string, requiredRole: UserRole): Promise<boolean> {
  const profile = await getUserProfile(userId);
  if (!profile) return false;
  if (requiredRole === "academy") return true;
  return profile.role === "admin";
}

export async function requireAdmin(userId: string): Promise<void> {
  const isAdmin = await hasRole(userId, "admin");
  if (!isAdmin) throw new Error("Se requiere rol de administrador");
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) throw new Error("Se requiere autenticación");
  return session;
}

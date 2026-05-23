"use server";

/**
 * Auth Actions — Autenticación personalizada directa en la tabla de base de datos
 * Bypassa por completo Supabase Auth y usa la tabla pública 'users'.
 */

import { createServerClient } from "@/lib/supabase";
import type { AppUser, UserRole } from "@/types/content";
import { cookies } from "next/headers";

export async function signUp(name: string, email: string, password: string) {
  const supabase = createServerClient();
  
  // Generar un ID único para el usuario
  const newUserId = crypto.randomUUID();
  const role: UserRole = email.toLowerCase().includes("admin") ? "admin" : "academy";

  // Insertar directamente en tu tabla public.users
  const { error } = await supabase
    .from("users")
    .insert({
      id: newUserId,
      email,
      password,
      role
    });
  
  if (error) {
    throw new Error(`Error al registrar en la tabla de usuarios: ${error.message}`);
  }
  
  // Seteamos el ID del usuario en la cookie de sesión
  const cookieStore = await cookies();
  cookieStore.set("wtii_session", newUserId, { path: "/" });

  return { success: true };
}

export async function signIn(email: string, password: string) {
  const supabase = createServerClient();

  // Consultar directamente en tu tabla public.users
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    throw new Error("Usuario no encontrado en la base de datos");
  }

  // Verificar la contraseña directamente en texto plano
  if (user.password !== password) {
    throw new Error("Contraseña incorrecta");
  }

  // Guardar el ID del usuario en la cookie para identificar su sesión
  const cookieStore = await cookies();
  cookieStore.set("wtii_session", user.id, { path: "/" });

  return { userId: user.id, email: user.email };
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("wtii_session");
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("wtii_session")?.value;
  if (!userId || userId === "true") return null;

  // Cargar perfil y rol desde tu tabla public.users
  const profile = await getUserProfile(userId);
  if (!profile) return null;

  return { 
    userId: profile.id, 
    email: profile.email || "", 
    role: profile.role 
  };
}

export async function getUserProfile(userId: string): Promise<AppUser | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

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

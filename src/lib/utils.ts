/**
 * Utility Functions
 *
 * Funciones compartidas para todo el proyecto.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma segura.
 * Evita conflictos entre clases duplicadas.
 *
 * @example cn("px-4 py-2", isActive && "bg-blue-500", "px-6") → "py-2 px-6 bg-blue-500"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda mexicana.
 *
 * @example formatCurrency(1500.5) → "$1,500.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

/**
 * Formatea un número con separadores de miles.
 *
 * @example formatNumber(25000) → "25,000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value);
}

/**
 * Formatea un porcentaje.
 *
 * @example formatPercentage(0.0345) → "3.45%"
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Pausa la ejecución por un número de milisegundos.
 * Útil para rate limiting.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Comun — utilitare (date calendaristice, formatare, alergii)
import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** "2027-06-12" -> Date la miezul noptii UTC (coloanele @db.Date nu au fus orar) */
export function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Data invalida");
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date -> "2027-06-12" (folosind componentele UTC) */
export function toDateOnly(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10);
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("ro-RO", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  });
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function daysUntil(date: Date | string) {
  const today = new Date();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(date).getTime() - t) / 86_400_000);
}

/** Alergiile sunt salvate ca text "Gluten,Nuci" (SQL Server nu are String[]) */
export function parseAllergies(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializeAllergies(list: string[]): string {
  return Array.from(new Set(list.map((s) => s.trim()).filter(Boolean))).join(",");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

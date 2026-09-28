import type { Plan } from "@/generated/prisma/enums";
import { PLANS } from "@/lib/plans";

/** Temas visuais do grupo. As cores ficam em globals.css ([data-theme=...]). */
export interface ThemeInfo {
  id: string;
  label: string;
  /** Amostra de cor para o seletor. */
  swatch: string;
}

export const THEMES: readonly ThemeInfo[] = [
  { id: "classico", label: "Clássico", swatch: "#e11d48" },
  { id: "natal", label: "Natal", swatch: "#b91c1c" },
  { id: "neon", label: "Neon", swatch: "#7c3aed" },
  { id: "minimalista", label: "Minimalista", swatch: "#0f172a" },
];

export const DEFAULT_THEME = "classico";

export function isThemeAllowed(theme: string, plan: Plan): boolean {
  return PLANS[plan].themes.includes(theme) && THEMES.some((t) => t.id === theme);
}

/** Tema efetivo: se o plano não permite (ex.: premium expirou), volta ao padrão. */
export function effectiveTheme(theme: string | null | undefined, plan: Plan): string {
  return theme && isThemeAllowed(theme, plan) ? theme : DEFAULT_THEME;
}

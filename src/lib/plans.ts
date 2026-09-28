import type { Plan } from "@/generated/prisma/enums";

/**
 * Recursos por plano. Toda regra que dependa de plano deve consultar daqui —
 * assim a monetização futura (premium, temas pagos) muda um só lugar.
 */
export interface PlanFeatures {
  maxParticipants: number;
  adsEnabled: boolean;
  themes: readonly string[];
}

export const PLANS: Record<Plan, PlanFeatures> = {
  FREE: { maxParticipants: 50, adsEnabled: true, themes: ["classico"] },
  PREMIUM: { maxParticipants: 300, adsEnabled: false, themes: ["classico", "natal", "neon", "minimalista"] },
};

export function planFeatures(plan: Plan): PlanFeatures {
  return PLANS[plan];
}

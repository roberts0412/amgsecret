/**
 * Nome da brincadeira do grupo. O sorteio é o mesmo; muda só como o grupo
 * chama a brincadeira ("amigo oculto" em MG/RJ, "amigo da onça" etc.).
 * Sem dependências de servidor: usado também nos formulários (cliente).
 */
export const GAME_KINDS = [
  { id: "secreto", term: "amigo secreto", emoji: "🎁", hint: "O clássico" },
  { id: "oculto", term: "amigo oculto", emoji: "🎁", hint: "Como se diz em MG, RJ e outros lugares" },
  { id: "onca", term: "amigo da onça", emoji: "🐆", hint: "Presentes engraçados e de brincadeira" },
  { id: "chocolate", term: "amigo chocolate", emoji: "🍫", hint: "Todo mundo troca chocolates" },
  { id: "invisivel", term: "amigo invisível", emoji: "🎁", hint: "Outro nome para o amigo secreto" },
] as const;

export type GameKind = (typeof GAME_KINDS)[number]["id"];
export const GAME_KIND_IDS = GAME_KINDS.map((k) => k.id) as [GameKind, ...GameKind[]];
export const DEFAULT_GAME_KIND: GameKind = "secreto";

/** Nome da brincadeira em minúsculas ("amigo oculto"); valor desconhecido → amigo secreto. */
export function gameTerm(kind: string | null | undefined): string {
  return (GAME_KINDS.find((k) => k.id === kind) ?? GAME_KINDS[0]).term;
}

/** Com inicial maiúscula ("Amigo oculto"), para títulos. */
export function gameTitle(kind: string | null | undefined): string {
  const t = gameTerm(kind);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Todos os nomes, para textos gerais ("amigo secreto, amigo oculto, amigo da onça…"). */
export const ALL_GAME_TERMS = GAME_KINDS.map((k) => k.term);

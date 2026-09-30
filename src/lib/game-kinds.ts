/**
 * Nome da brincadeira do grupo. O sorteio é o mesmo; muda só como o grupo
 * chama a brincadeira ("amigo oculto" em MG/RJ, "amigo da onça" etc.).
 * "outro": o organizador escreve o nome (gameName).
 * Sem dependências de servidor: usado também nos formulários (cliente).
 */
export const GAME_KINDS = [
  { id: "secreto", term: "amigo secreto", emoji: "🎁", hint: "O clássico" },
  { id: "oculto", term: "amigo oculto", emoji: "🎁", hint: "Como se diz em MG, RJ e outros lugares" },
  { id: "onca", term: "amigo da onça", emoji: "🐆", hint: "Presentes engraçados e de brincadeira" },
  { id: "chocolate", term: "amigo chocolate", emoji: "🍫", hint: "Todo mundo troca chocolates" },
  { id: "invisivel", term: "amigo invisível", emoji: "🎁", hint: "Outro nome para o amigo secreto" },
  { id: "outro", term: "outro", emoji: "✏️", hint: "Escreva o nome que o seu grupo usa" },
] as const;

export type GameKind = (typeof GAME_KINDS)[number]["id"];
export const GAME_KIND_IDS = GAME_KINDS.map((k) => k.id) as [GameKind, ...GameKind[]];
export const DEFAULT_GAME_KIND: GameKind = "secreto";
export const CUSTOM_GAME_KIND: GameKind = "outro";
export const GAME_NAME_MAX = 30;

/** As brincadeiras com nome pronto (sem "outro"), para listas na página inicial. */
export const NAMED_GAME_KINDS = GAME_KINDS.filter((k) => k.id !== CUSTOM_GAME_KIND);

/** O que os grupos guardam: o tipo e, se for "outro", o nome escrito. */
export type GameLike = { gameKind?: string | null; gameName?: string | null };

/** Nome da brincadeira para usar no meio da frase ("amigo oculto"); desconhecido → amigo secreto. */
export function gameTerm(game: GameLike | null | undefined): string {
  if (game?.gameKind === CUSTOM_GAME_KIND) return game.gameName?.trim() || GAME_KINDS[0].term;
  const known = NAMED_GAME_KINDS.find((k) => k.id === game?.gameKind);
  return (known ?? GAME_KINDS[0]).term;
}

/** Com inicial maiúscula ("Amigo oculto"), para títulos. */
export function gameTitle(game: GameLike | null | undefined): string {
  const t = gameTerm(game);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

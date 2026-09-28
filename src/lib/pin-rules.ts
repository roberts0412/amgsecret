/** Regras de formato do PIN (puras; usadas na validação e no servidor). */
export const PIN_LENGTH = 6;

export type PinProblem = "FORMAT" | "WEAK";

/** Valida formato e recusa PINs óbvios (repetidos, sequências, padrões). */
export function checkPin(pin: string): PinProblem | null {
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return "FORMAT";
  const d = [...pin].map(Number);
  const allSame = d.every((x) => x === d[0]);
  const asc = d.every((x, i) => i === 0 || x === (d[i - 1]! + 1) % 10);
  const desc = d.every((x, i) => i === 0 || x === (d[i - 1]! + 9) % 10);
  const halves = pin.slice(0, 3) === pin.slice(3); // 123123
  const pairs = /^(\d\d)\1\1$/.test(pin); // 121212
  const distinct = new Set(d).size;
  if (allSame || asc || desc || halves || pairs || distinct <= 2) return "WEAK";
  return null;
}

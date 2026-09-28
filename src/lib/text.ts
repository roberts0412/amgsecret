/**
 * Normalização de texto de entrada do usuário.
 * Não é proteção contra XSS (o React escapa na saída); é higiene de dados:
 * remove caracteres de controle/invisíveis e espaços supérfluos.
 */

// Controles C0/C1 e DEL (exceto \n e \t, tratados à parte).
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
// Zero-width (exceto ZWJ, usado em emojis compostos), marcas de direção
// (bidi override pode disfarçar nomes/links) e BOM.
const INVISIBLE = /[\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/** Texto de uma linha (nomes, títulos): colapsa todo espaço em um só. */
export function cleanLine(input: string): string {
  return input.normalize("NFC").replace(CONTROL, "").replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
}

/** Texto de várias linhas (mensagens, descrições): preserva quebras, no máximo 2 seguidas. */
export function cleanMultiline(input: string): string {
  return input
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL, "")
    .replace(INVISIBLE, "")
    .split("\n")
    .map((l) => l.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Chave de comparação de nomes: "  José  da Silva" == "jose da silva". */
export function nameKey(name: string): string {
  return cleanLine(name)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
}

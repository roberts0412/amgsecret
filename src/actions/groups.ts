"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, runAction } from "@/lib/auth/action";
import { enforceRateLimit } from "@/lib/auth/rate-limit";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { createGroup, removeParticipant, updateGroupDetails } from "@/lib/services/groups";
import { confirmParticipation, findByAccessToken, joinGroup } from "@/lib/services/participants";
import { normalizeGroupCode } from "@/lib/security/tokens";
import { createGroupSchema, formToObject, groupDetailsSchema, joinGroupSchema, parseInput } from "@/lib/validation";

/*
 * Toda Server Action é um endpoint público (POST). Regras seguidas aqui:
 * - identidade vem SÓ do cookie de sessão (getSession), nunca do formulário;
 * - o formulário só indica o grupo (código) e, quando preciso, o alvo (id),
 *   e o service confere se o alvo pertence ao grupo do usuário;
 * - retorno contém apenas mensagem/erros de campo.
 */

function codeFrom(form: FormData): string {
  const code = normalizeGroupCode(String(form.get("code") ?? ""));
  if (!code) throw new AppError("NOT_FOUND", "Grupo não encontrado.");
  return code;
}

export async function createGroupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const values = formToObject(form);
  let code = "";
  const state = await runAction(async () => {
    await enforceRateLimit("createGroup");
    const input = parseInput(createGroupSchema(), values);
    const created = await createGroup(getDb(), input);
    await setSessionCookie(created.code, created.token);
    code = created.code;
  }, values);
  // redirect fora do try: é um "throw" de controle do Next
  if (state.ok) redirect(`/grupo/${code}?novo=1`);
  return state;
}

export async function joinGroupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const values = formToObject(form);
  let code = "";
  const state = await runAction(async () => {
    code = codeFrom(form);
    await enforceRateLimit("joinGroup");
    const input = parseInput(joinGroupSchema, values);
    const joined = await joinGroup(getDb(), code, input);
    await setSessionCookie(joined.code, joined.token);
  }, values);
  if (state.ok) redirect(`/grupo/${code}?entrou=1`);
  return state;
}

export async function confirmParticipationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("participantAction");
    await confirmParticipation(getDb(), await getSession(code));
    revalidatePath(`/grupo/${code}`);
    return { ok: true, message: "Presença confirmada! 🎉" };
  });
}

export async function updateGroupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const values = formToObject(form);
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("organizerAction");
    const input = parseInput(groupDetailsSchema(), values);
    await updateGroupDetails(getDb(), await getSession(code), input);
    revalidatePath(`/grupo/${code}`, "layout");
    return { ok: true, message: "Dados do grupo atualizados." };
  }, values);
}

export async function removeParticipantAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("organizerAction");
    const participantId = String(form.get("participantId") ?? "");
    if (!/^[a-z0-9]{20,40}$/.test(participantId)) throw new AppError("NOT_FOUND", "Participante não encontrado.");
    await removeParticipant(getDb(), await getSession(code), participantId);
    revalidatePath(`/grupo/${code}`, "layout");
    return { ok: true, message: "Participante removido." };
  });
}

/** "Sair deste aparelho": apaga o cookie. O link privado continua valendo. */
export async function logoutAction(form: FormData): Promise<void> {
  const code = normalizeGroupCode(String(form.get("code") ?? ""));
  if (code) await clearSessionCookie(code);
  redirect(code ? `/grupo/${code}` : "/");
}

/** Troca o token do link privado por cookie (POST — evita login CSRF e pré-visualizações). */
export async function accessWithTokenAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let code = "";
  const state = await runAction(async () => {
    await enforceRateLimit("tokenAccess");
    const token = String(form.get("token") ?? "");
    const found = await findByAccessToken(getDb(), token);
    if (!found) throw new AppError("NOT_FOUND", "Link inválido ou expirado. Peça um novo ao organizador.");
    await setSessionCookie(found.groupCode, token);
    code = found.groupCode;
  });
  if (state.ok) redirect(`/grupo/${code}`);
  return state;
}

/** Tela inicial: "Entrar em um grupo" digitando o código. */
export async function goToGroupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = String(form.get("code") ?? "")
    .trim()
    // aceita o link inteiro colado: pega o que vem depois de /grupo/
    .replace(/^.*\/grupo\//i, "")
    .replace(/[/?#].*$/, "");
  let code: string | null = null;
  const state = await runAction(async () => {
    await enforceRateLimit("lookupGroup");
    code = normalizeGroupCode(raw);
    if (!code) throw new AppError("VALIDATION", "Código inválido. Ele tem 6 letras/números, como K7PX2M.", { code: "Código inválido." });
    const exists = await getDb().group.findUnique({ where: { code }, select: { status: true } });
    if (!exists || exists.status === "ARCHIVED") throw new AppError("NOT_FOUND", "Nenhum grupo com esse código.", { code: "Não encontrado." });
  }, { code: raw });
  if (state.ok && code) redirect(`/grupo/${code}`);
  return state;
}

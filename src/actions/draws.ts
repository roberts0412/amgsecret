"use server";

import { revalidatePath } from "next/cache";
import { type ActionState, runAction } from "@/lib/auth/action";
import { enforceRateLimit } from "@/lib/auth/rate-limit";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { AppError, GENERIC_ERROR } from "@/lib/errors";
import { addExclusion, redoDraw, removeExclusion, reopenGroup, revealMyResult, runDraw } from "@/lib/services/draws";
import { normalizeGroupCode } from "@/lib/security/tokens";

/* Mesmas regras de src/actions/groups.ts: identidade só pelo cookie. */

const ID = /^[a-z0-9]{20,40}$/;

function codeFrom(form: FormData): string {
  const code = normalizeGroupCode(String(form.get("code") ?? ""));
  if (!code) throw new AppError("NOT_FOUND", "Grupo não encontrado.");
  return code;
}

function idFrom(form: FormData, key: string, label = "Participante"): string {
  const id = String(form.get(key) ?? "");
  if (!ID.test(id)) throw new AppError("VALIDATION", `${label} inválido.`, { [key]: "Escolha uma opção." });
  return id;
}

/** Ações destrutivas exigem confirmação explícita enviada pelo diálogo. */
function requireConfirmation(form: FormData) {
  if (form.get("confirm") !== "sim") throw new AppError("VALIDATION", "Confirme a ação para continuar.");
}

function refresh(code: string) {
  revalidatePath(`/grupo/${code}`, "layout");
}

export async function addExclusionAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("organizerAction");
    const r = await addExclusion(getDb(), await getSession(code), {
      participantId: idFrom(form, "participantId"),
      excludedParticipantId: idFrom(form, "excludedParticipantId"),
      mutual: form.get("mutual") === "on",
    });
    refresh(code);
    return r.stillPossible
      ? { ok: true, message: "Regra adicionada." }
      : {
          ok: true,
          message: "Regra adicionada, mas atenção: com as regras atuais o sorteio NÃO é possível. Remova ou altere alguma exclusão.",
        };
  });
}

export async function removeExclusionAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("organizerAction");
    await removeExclusion(getDb(), await getSession(code), idFrom(form, "exclusionId", "Regra"));
    refresh(code);
    return { ok: true, message: "Regra removida." };
  });
}

export async function runDrawAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const code = codeFrom(form);
    requireConfirmation(form);
    await enforceRateLimit("organizerAction");
    const { size } = await runDraw(getDb(), await getSession(code));
    refresh(code);
    return { ok: true, message: `Sorteio realizado com ${size} participantes! 🎉 Cada um já pode ver quem tirou.` };
  });
}

export async function redoDrawAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const code = codeFrom(form);
    requireConfirmation(form);
    await enforceRateLimit("organizerAction");
    const { size } = await redoDraw(getDb(), await getSession(code));
    refresh(code);
    return { ok: true, message: `Novo sorteio realizado com ${size} participantes. Os resultados anteriores foram invalidados.` };
  });
}

export async function reopenGroupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const code = codeFrom(form);
    requireConfirmation(form);
    await enforceRateLimit("organizerAction");
    await reopenGroup(getDb(), await getSession(code));
    refresh(code);
    return { ok: true, message: "Sorteio cancelado. O grupo está aberto para mudanças." };
  });
}

export interface RevealState {
  ok: boolean;
  message?: string;
  /** Só nome e apelido — nunca IDs. */
  friend?: { name: string; nickname: string | null };
}

/** Revela o MEU amigo secreto (o nome não vem no HTML da página). */
export async function revealAction(_prev: RevealState, form: FormData): Promise<RevealState> {
  try {
    const code = codeFrom(form);
    await enforceRateLimit("participantAction");
    const friend = await revealMyResult(getDb(), await getSession(code));
    return { ok: true, friend: { name: friend.name, nickname: friend.nickname } };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, message: e.message };
    console.error("[reveal] erro inesperado", e);
    return { ok: false, message: GENERIC_ERROR };
  }
}

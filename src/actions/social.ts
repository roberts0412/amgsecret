"use server";

import { revalidatePath } from "next/cache";
import { type ActionState, runAction } from "@/lib/auth/action";
import { enforceRateLimit } from "@/lib/auth/rate-limit";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import {
  addWish,
  deleteWallPost,
  deleteWish,
  postToWall,
  replyToSanta,
  sendToFriend,
} from "@/lib/services/social";
import { normalizeGroupCode } from "@/lib/security/tokens";
import { echoableValues, formToObject, parseInput, secretMessageSchema, wallPostSchema, wishSchema } from "@/lib/validation";

/* Mesmas regras das outras actions: identidade só pelo cookie de sessão. */

function codeFrom(form: FormData): string {
  const code = normalizeGroupCode(String(form.get("code") ?? ""));
  if (!code) throw new AppError("NOT_FOUND", "Grupo não encontrado.");
  return code;
}

function idFrom(form: FormData, key: string): string {
  const id = String(form.get(key) ?? "");
  if (!/^[a-z0-9]{20,40}$/.test(id)) throw new AppError("NOT_FOUND", "Item não encontrado.");
  return id;
}

function refresh(code: string) {
  revalidatePath(`/grupo/${code}`, "layout");
}

export async function addWishAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const values = formToObject(form);
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("participantAction");
    await addWish(getDb(), await getSession(code), parseInput(wishSchema, values));
    refresh(code);
    return { ok: true, message: "Desejo adicionado! 🎁" };
  }, echoableValues(values));
}

export async function deleteWishAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("participantAction");
    await deleteWish(getDb(), await getSession(code), idFrom(form, "wishId"));
    refresh(code);
    return { ok: true };
  });
}

export async function sendToFriendAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const values = formToObject(form);
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("sendMessage");
    const { body } = parseInput(secretMessageSchema, values);
    await sendToFriend(getDb(), await getSession(code), body);
    refresh(code);
    return { ok: true, message: "Mensagem enviada em segredo 🤫" };
  }, echoableValues(values));
}

export async function replyToSantaAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const values = formToObject(form);
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("sendMessage");
    const { body } = parseInput(secretMessageSchema, values);
    await replyToSanta(getDb(), await getSession(code), body);
    refresh(code);
    return { ok: true, message: "Resposta enviada!" };
  }, echoableValues(values));
}

export async function postToWallAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const values = formToObject(form);
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("wallPost");
    const { body } = parseInput(wallPostSchema, values);
    await postToWall(getDb(), await getSession(code), body);
    refresh(code);
    return { ok: true, message: "Publicado no mural!" };
  }, echoableValues(values));
}

export async function deleteWallPostAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const code = codeFrom(form);
    await enforceRateLimit("participantAction");
    await deleteWallPost(getDb(), await getSession(code), idFrom(form, "postId"));
    refresh(code);
    return { ok: true };
  });
}

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, truncateAll } from "../../../test/db";
import type { OutgoingEmail } from "@/lib/email/send";
import { unsubscribeUrl, verifyUnsubscribe } from "@/lib/email/unsubscribe";
import { runDraw } from "./draws";
import { createGroup } from "./groups";
import { authenticate, confirmParticipation, joinGroup } from "./participants";
import { notifyDrawDone, sendEventReminders, unsubscribeParticipant } from "./notifications";

const db = testDb();
beforeEach(() => truncateAll(db));
afterAll(() => db.$disconnect());

function fakeSender() {
  const sent: OutgoingEmail[] = [];
  return { sent, send: async (m: OutgoingEmail[]) => (sent.push(...m), m.length) };
}

async function setup(eventDate?: string) {
  const { code, token } = await createGroup(db, { name: "Natal", organizerName: "Robert", pin: "905527", gameKind: "oculto", eventDate });
  const org = (await authenticate(db, code, token))!;
  const ids: Record<string, string> = {};
  for (const [name, email] of [["Maria", "maria@exemplo.com"], ["João", undefined], ["Carlos", "carlos@exemplo.com"]] as const) {
    const r = await joinGroup(db, code, { name, pin: "730164", email });
    const s = (await authenticate(db, code, r.token))!;
    await confirmParticipation(db, s);
    ids[name] = s.id;
  }
  // alguém com e-mail que não confirmou (fica fora do sorteio)
  await joinGroup(db, code, { name: "Pendente", pin: "730164", email: "pendente@exemplo.com" });
  return { code, org, ids };
}

describe("e-mails de aviso", () => {
  it("aviso do sorteio: só para quem está no sorteio e informou e-mail; sem revelar resultado", async () => {
    const { org } = await setup();
    const { sent, send } = fakeSender();
    expect(await notifyDrawDone(db, org.group.id, send)).toBe(0); // antes do sorteio: nada
    await runDraw(db, org);
    expect(await notifyDrawDone(db, org.group.id, send)).toBe(2);
    expect(sent.map((m) => m.to).sort()).toEqual(["carlos@exemplo.com", "maria@exemplo.com"]);
    for (const m of sent) {
      expect(m.subject).toContain("amigo oculto");
      // nenhum outro nome do grupo aparece (o resultado não vai por e-mail)
      const others = ["Robert", "João", "Carlos", "Maria"].filter((n) => !m.html.includes(`Oi, ${n}!`));
      for (const n of others) expect(m.html).not.toContain(n);
      expect(verifyUnsubscribe(new URL(m.unsubUrl).searchParams.get("p"), new URL(m.unsubUrl).searchParams.get("s"))).toBe(true);
    }
  });

  it("lembrete: 3 dias antes, uma única vez, mesmo com execuções simultâneas", async () => {
    const now = new Date("2026-12-21T12:00:00Z"); // 21/12 em São Paulo → festa 24/12
    const { org } = await setup("2026-12-24");
    await runDraw(db, org);
    const { sent, send } = fakeSender();
    expect(await sendEventReminders(db, new Date("2026-12-20T12:00:00Z"), send)).toEqual({ groups: 0, emails: 0 }); // cedo demais
    const [a, b] = await Promise.all([sendEventReminders(db, now, send), sendEventReminders(db, now, send)]);
    expect(a.groups + b.groups).toBe(1);
    expect(sent).toHaveLength(2);
    expect(sent[0]!.subject).toContain("Faltam 3 dias");
    expect(await sendEventReminders(db, now, send)).toEqual({ groups: 0, emails: 0 });
  });

  it("descadastro: link assinado apaga o e-mail; assinatura errada não vale", async () => {
    const { ids } = await setup();
    const url = new URL(unsubscribeUrl(ids.Maria!));
    expect(verifyUnsubscribe(ids.Maria, url.searchParams.get("s"))).toBe(true);
    expect(verifyUnsubscribe(ids.Carlos, url.searchParams.get("s"))).toBe(false);
    expect(verifyUnsubscribe(ids.Maria, "x".repeat(32))).toBe(false);
    expect(verifyUnsubscribe("../../etc", url.searchParams.get("s"))).toBe(false);
    await unsubscribeParticipant(db, ids.Maria!);
    expect((await db.participant.findUniqueOrThrow({ where: { id: ids.Maria! } })).email).toBeNull();
  });
});

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, truncateAll } from "../../../test/db";
import { runDraw, revealMyResult } from "./draws";
import { createGroup } from "./groups";
import { authenticate, confirmParticipation, joinGroup } from "./participants";
import { getSiteStats } from "./stats";

const db = testDb();
beforeEach(() => truncateAll(db));
afterAll(() => db.$disconnect());

describe("estatísticas do painel do dono", () => {
  it("conta grupos, sorteios, pessoas, revelações e brincadeiras; só números", async () => {
    const { code, token } = await createGroup(db, { name: "Natal", organizerName: "Robert", pin: "905527", gameKind: "oculto" });
    await createGroup(db, { name: "Firma", organizerName: "Ana", pin: "905527" });
    const org = (await authenticate(db, code, token))!;
    for (const n of ["Maria", "João"]) {
      const r = await joinGroup(db, code, { name: n, pin: "730164" });
      await confirmParticipation(db, (await authenticate(db, code, r.token))!);
    }
    await runDraw(db, org);
    await revealMyResult(db, (await authenticate(db, code, token))!);

    const s = await getSiteStats(db);
    expect(s).toMatchObject({ groups: 2, groupsDrawn: 1, participants: 4, revealed: 1, wishes: 0 });
    expect(s.byKind).toEqual(expect.arrayContaining([{ kind: "oculto", count: 1 }, { kind: "secreto", count: 1 }]));
    expect(s.daily).toHaveLength(1);
    expect(s.daily[0]).toMatchObject({ groups: 2, participants: 4 });
    expect(s.daily[0]!.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // nada identificável
    expect(JSON.stringify(s)).not.toMatch(/Robert|Maria|Natal|Firma/);
    expect(JSON.stringify(s)).not.toContain(code);
  });
});

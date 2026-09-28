import { afterEach, describe, expect, it } from "vitest";
import { resetEnvCache } from "@/lib/env";
import {
  clearKeyCache,
  decryptReceiver,
  encryptReceiver,
  lookupEquals,
  PairDecryptionError,
  receiverLookup,
  senderLookup,
} from "./pair-crypto";

const ref = { drawId: "draw_1", giverId: "giver_1" };

afterEach(() => {
  resetEnvCache();
  clearKeyCache();
});

describe("pair-crypto", () => {
  it("cifra e decifra o sorteado", () => {
    const enc = encryptReceiver(ref, "receiver_1");
    expect(enc).toMatch(/^v1\./);
    expect(enc).not.toContain("receiver_1");
    expect(decryptReceiver(ref, enc)).toBe("receiver_1");
  });

  it("cifragem é aleatória (mesmo par gera textos diferentes)", () => {
    expect(encryptReceiver(ref, "r")).not.toBe(encryptReceiver(ref, "r"));
  });

  it("cabe na coluna do banco (VarChar 255) com IDs cuid", () => {
    expect(encryptReceiver(ref, "cm1abcdefghijklmnopqrstuvw").length).toBeLessThan(255);
  });

  it("recusa texto cifrado copiado para outro par/sorteio (AAD)", () => {
    const enc = encryptReceiver(ref, "receiver_1");
    expect(() => decryptReceiver({ ...ref, giverId: "giver_2" }, enc)).toThrow(PairDecryptionError);
    expect(() => decryptReceiver({ ...ref, drawId: "draw_2" }, enc)).toThrow(PairDecryptionError);
  });

  it("recusa texto adulterado ou malformado", () => {
    const enc = encryptReceiver(ref, "receiver_1");
    const [v, iv, ct, tag] = enc.split(".");
    const flipped = Buffer.from(ct!, "base64url");
    flipped[0]! ^= 1;
    expect(() => decryptReceiver(ref, [v, iv, flipped.toString("base64url"), tag].join("."))).toThrow(PairDecryptionError);
    expect(() => decryptReceiver(ref, "v2." + enc.slice(3))).toThrow(PairDecryptionError);
    expect(() => decryptReceiver(ref, "lixo")).toThrow(PairDecryptionError);
    expect(() => decryptReceiver(ref, `v1.${iv}.${ct}.AAAA`)).toThrow(PairDecryptionError);
  });

  it("não decifra com outro APP_SECRET", () => {
    const enc = encryptReceiver(ref, "receiver_1");
    const original = process.env.APP_SECRET;
    process.env.APP_SECRET = "another-secret-0123456789-abcdefghijklmnopqrstuvwxyz";
    resetEnvCache();
    try {
      expect(() => decryptReceiver(ref, enc)).toThrow(PairDecryptionError);
    } finally {
      process.env.APP_SECRET = original;
    }
  });

  it("lookups são determinísticos, separados por finalidade e por sorteio", () => {
    expect(receiverLookup("d", "p")).toBe(receiverLookup("d", "p"));
    expect(receiverLookup("d", "p")).toMatch(/^[0-9a-f]{64}$/);
    expect(receiverLookup("d", "p")).not.toBe(senderLookup("d", "p"));
    expect(receiverLookup("d1", "p")).not.toBe(receiverLookup("d2", "p"));
    // concatenação ambígua não colide
    expect(receiverLookup("ab", "c")).not.toBe(receiverLookup("a", "bc"));
    expect(lookupEquals(senderLookup("d", "p"), senderLookup("d", "p"))).toBe(true);
    expect(lookupEquals(senderLookup("d", "p"), senderLookup("d", "q"))).toBe(false);
  });
});

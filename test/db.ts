import { createPrismaClient } from "@/lib/db/client";
import type { PrismaClient } from "@/generated/prisma/client";
import { generateGroupCode, generateToken, hashToken } from "@/lib/security/tokens";
import { nameKey } from "@/lib/text";

export function testDb(): PrismaClient {
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL ausente");
  return createPrismaClient(url);
}

export async function truncateAll(db: PrismaClient) {
  await db.$executeRawUnsafe(
    `TRUNCATE "SecretMessage","WallPost","WishlistItem","DrawPair","Draw","Exclusion","Participant","Group" RESTART IDENTITY CASCADE`,
  );
}

export async function makeGroup(db: PrismaClient, names: string[] = ["Ana", "Bia", "Caio"]) {
  const group = await db.group.create({ data: { code: generateGroupCode(), name: "Natal da Família" } });
  const participants = [];
  for (const [i, name] of names.entries()) {
    participants.push(
      await db.participant.create({
        data: {
          groupId: group.id,
          name,
          nameKey: nameKey(name),
          tokenHash: hashToken(generateToken()),
          role: i === 0 ? "ORGANIZER" : "MEMBER",
          status: "CONFIRMED",
        },
      }),
    );
  }
  return { group, participants };
}

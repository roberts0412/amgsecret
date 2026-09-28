-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('OPEN', 'DRAWN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('INVITED', 'CONFIRMED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('ORGANIZER', 'MEMBER');

-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('ACTIVE', 'INVALIDATED');

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(500),
    "eventDate" VARCHAR(10),
    "eventTime" VARCHAR(5),
    "location" VARCHAR(120),
    "giftValueCents" INTEGER,
    "status" "GroupStatus" NOT NULL DEFAULT 'OPEN',
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "theme" VARCHAR(30) NOT NULL DEFAULT 'classico',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "nameKey" VARCHAR(60) NOT NULL,
    "nickname" VARCHAR(40),
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "role" "ParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "status" "ParticipantStatus" NOT NULL DEFAULT 'INVITED',
    "tokenHash" CHAR(64) NOT NULL,
    "tokenIssuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exclusion" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "excludedParticipantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "status" "DrawStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invalidatedAt" TIMESTAMP(3),

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawPair" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverEnc" VARCHAR(255) NOT NULL,
    "receiverLookup" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "product" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "approxPriceCents" INTEGER,
    "url" VARCHAR(2048),
    "note" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretMessage" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "senderLookup" CHAR(64) NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WallPost" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WallPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Group_creatorId_key" ON "Group"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_tokenHash_key" ON "Participant"("tokenHash");

-- CreateIndex
CREATE INDEX "Participant_groupId_status_idx" ON "Participant"("groupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_groupId_nameKey_key" ON "Participant"("groupId", "nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_groupId_id_key" ON "Participant"("groupId", "id");

-- CreateIndex
CREATE INDEX "Exclusion_groupId_idx" ON "Exclusion"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Exclusion_participantId_excludedParticipantId_key" ON "Exclusion"("participantId", "excludedParticipantId");

-- CreateIndex
CREATE INDEX "Draw_groupId_status_idx" ON "Draw"("groupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DrawPair_drawId_giverId_key" ON "DrawPair"("drawId", "giverId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawPair_drawId_receiverLookup_key" ON "DrawPair"("drawId", "receiverLookup");

-- CreateIndex
CREATE INDEX "WishlistItem_participantId_idx" ON "WishlistItem"("participantId");

-- CreateIndex
CREATE INDEX "SecretMessage_drawId_recipientId_idx" ON "SecretMessage"("drawId", "recipientId");

-- CreateIndex
CREATE INDEX "SecretMessage_drawId_senderLookup_idx" ON "SecretMessage"("drawId", "senderLookup");

-- CreateIndex
CREATE INDEX "WallPost_groupId_createdAt_idx" ON "WallPost"("groupId", "createdAt");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exclusion" ADD CONSTRAINT "Exclusion_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exclusion" ADD CONSTRAINT "Exclusion_groupId_participantId_fkey" FOREIGN KEY ("groupId", "participantId") REFERENCES "Participant"("groupId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exclusion" ADD CONSTRAINT "Exclusion_groupId_excludedParticipantId_fkey" FOREIGN KEY ("groupId", "excludedParticipantId") REFERENCES "Participant"("groupId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawPair" ADD CONSTRAINT "DrawPair_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawPair" ADD CONSTRAINT "DrawPair_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretMessage" ADD CONSTRAINT "SecretMessage_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretMessage" ADD CONSTRAINT "SecretMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallPost" ADD CONSTRAINT "WallPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallPost" ADD CONSTRAINT "WallPost_groupId_authorId_fkey" FOREIGN KEY ("groupId", "authorId") REFERENCES "Participant"("groupId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Restrições extras (não expressáveis no schema Prisma). Defesa em profundidade:
-- mesmo que a aplicação erre, o banco recusa estados inválidos.
-- O Prisma ignora CHECKs e índices parciais no diff, então não serão removidos.
-- ---------------------------------------------------------------------------

-- No máximo UM sorteio ativo por grupo.
CREATE UNIQUE INDEX "Draw_one_active_per_group" ON "Draw"("groupId") WHERE "status" = 'ACTIVE';

-- Ninguém é "excluído" de tirar a si mesmo (isso já é regra fixa do sorteio).
ALTER TABLE "Exclusion" ADD CONSTRAINT "Exclusion_not_self" CHECK ("participantId" <> "excludedParticipantId");

-- Valores monetários não negativos.
ALTER TABLE "Group" ADD CONSTRAINT "Group_giftValue_nonneg" CHECK ("giftValueCents" IS NULL OR "giftValueCents" >= 0);
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_price_nonneg" CHECK ("approxPriceCents" IS NULL OR "approxPriceCents" >= 0);

-- Formatos de data/hora do evento.
ALTER TABLE "Group" ADD CONSTRAINT "Group_eventDate_format" CHECK ("eventDate" IS NULL OR "eventDate" ~ '^\d{4}-\d{2}-\d{2}$');
ALTER TABLE "Group" ADD CONSTRAINT "Group_eventTime_format" CHECK ("eventTime" IS NULL OR "eventTime" ~ '^([01]\d|2[0-3]):[0-5]\d$');

-- Sorteio invalidado precisa ter data de invalidação.
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_invalidated_has_date" CHECK ("status" <> 'INVALIDATED' OR "invalidatedAt" IS NOT NULL);

-- Textos obrigatórios precisam de ao menos um caractere não-branco
-- (btrim não bastaria: só remove espaços, não \n/\t).
ALTER TABLE "Group" ADD CONSTRAINT "Group_name_not_blank" CHECK ("name" ~ '\S');
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_name_not_blank" CHECK ("name" ~ '\S');
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_product_not_blank" CHECK ("product" ~ '\S');
ALTER TABLE "WallPost" ADD CONSTRAINT "WallPost_body_not_blank" CHECK ("body" ~ '\S');
ALTER TABLE "SecretMessage" ADD CONSTRAINT "SecretMessage_body_not_blank" CHECK ("body" ~ '\S');

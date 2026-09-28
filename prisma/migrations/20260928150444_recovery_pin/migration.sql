-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "pinFailedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pinHash" VARCHAR(200),
ADD COLUMN     "pinLockedUntil" TIMESTAMP(3);

-- Contador de falhas nunca negativo.
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_pinFailedAttempts_nonneg" CHECK ("pinFailedAttempts" >= 0);

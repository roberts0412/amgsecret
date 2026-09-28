-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('FROM_SANTA', 'FROM_FRIEND');

-- AlterTable
ALTER TABLE "SecretMessage" ADD COLUMN     "direction" "MessageDirection" NOT NULL DEFAULT 'FROM_SANTA';

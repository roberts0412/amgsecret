import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

/**
 * Cliente Prisma único por processo. Em desenvolvimento o Next recarrega
 * módulos; guardar no globalThis evita abrir um pool novo a cada reload.
 *
 * Ajustado para picos (teste de carga em scripts/loadtest.mjs):
 * - pool de conexões configurável (o padrão do driver, 10, fazia pedidos
 *   desistirem com 200 acessos simultâneos);
 * - transações esperam até 10 s por uma conexão livre (padrão: 2 s) antes
 *   de desistir — num pico, esperar um pouco é melhor que falhar.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function createPrismaClient(
  connectionString = getEnv().DATABASE_URL,
  poolMax = getEnv().DATABASE_POOL_MAX,
): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: poolMax,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    }),
    transactionOptions: { maxWait: 10_000, timeout: 20_000 },
  });
}

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createPrismaClient();
  return globalForPrisma.prisma;
}

import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool as PgPool } from "pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const provider = detectProvider()
  const adapter = provider === "mysql" ? createMariaDbAdapter() : createPgAdapter()

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

function detectProvider() {
  const provider = process.env.DATABASE_PROVIDER?.trim().toLowerCase()
  if (provider === "mysql" || provider === "mariadb") return "mysql"
  if (provider === "postgresql" || provider === "postgres") return "postgresql"

  const url = process.env.DATABASE_URL?.trim().toLowerCase() ?? ""
  if (url.startsWith("mysql://") || url.startsWith("mariadb://")) {
    return "mysql"
  }

  return "postgresql"
}

function createPgAdapter() {
  const pool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  })
  return new PrismaPg(pool)
}

function createMariaDbAdapter() {
  return new PrismaMariaDb(process.env.DATABASE_URL ?? "")
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

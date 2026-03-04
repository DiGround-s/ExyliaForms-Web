import { spawnSync } from "node:child_process"

function runPrisma(args, env) {
  const npmExecPath = process.env.npm_execpath
  const result = npmExecPath
    ? spawnSync(process.execPath, [npmExecPath, "exec", "prisma", ...args], {
        stdio: "inherit",
        env,
      })
    : spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", ...args], {
        stdio: "inherit",
        env,
      })

  if (result.error) {
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function detectProvider() {
  const provider = process.env.DATABASE_PROVIDER?.trim().toLowerCase()
  if (provider) {
    if (provider === "mariadb") return "mysql"
    return provider
  }

  const url = process.env.DATABASE_URL?.trim().toLowerCase() ?? ""
  if (url.startsWith("mysql://") || url.startsWith("mariadb://")) {
    return "mysql"
  }
  return "postgresql"
}

const provider = detectProvider()
const env = { ...process.env, DATABASE_PROVIDER: provider }
const schema = provider === "mysql" ? "prisma/schema.mysql.prisma" : "prisma/schema.prisma"

if (provider === "mysql") {
  runPrisma(["db", "push", "--skip-generate", "--schema", schema], env)
} else {
  runPrisma(["migrate", "deploy", "--schema", schema], env)
}

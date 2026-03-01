import { prisma } from "./prisma"

const DEFAULTS: Record<string, string> = {
  app_name: "Exylia Forms",
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { key } })
  return row?.value ?? DEFAULTS[key] ?? ""
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

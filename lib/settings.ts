import { unstable_cache } from "next/cache"
import { prisma } from "./prisma"

export const SETTINGS_CACHE_TAG = "settings"

const DEFAULTS: Record<string, string> = {
  app_name: "Exylia Forms",
  logo_url: "",
  favicon_url: "",
  color_preset: "purple",
  primary_hue: "277",
  sidebar_style: "default",
  border_radius: "md",
  font_family: "geist",
  custom_css: "",
  default_locale: "en",
  custom_gradient_hue1: "277",
  custom_gradient_hue2: "195",
  dm_received_title: "📋 Solicitud recibida",
  dm_received_description: "Tu respuesta al formulario **{{formTitle}}** ha sido registrada correctamente y está pendiente de revisión.",
  dm_received_footer: "Recibirás un mensaje cuando tu solicitud sea revisada.",
  dm_received_color: "#5865F2",
  dm_accepted_title: "✅ Solicitud aceptada",
  dm_accepted_description: "¡Buenas noticias! Tu respuesta al formulario **{{formTitle}}** ha sido **aceptada**.",
  dm_accepted_footer: "Gracias por tu participación.",
  dm_accepted_color: "#57F287",
  dm_rejected_title: "❌ Solicitud rechazada",
  dm_rejected_description: "Tu respuesta al formulario **{{formTitle}}** ha sido **rechazada**.",
  dm_rejected_cooldown: "Podrás volver a aplicar en **{{cooldownDays}}** día(s).",
  dm_rejected_footer: "Puedes contactar con el equipo si tienes dudas.",
  dm_rejected_color: "#ED4245",
}

const getAllSettings = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const rows = await prisma.appSetting.findMany()
    const result: Record<string, string> = { ...DEFAULTS }
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  },
  [SETTINGS_CACHE_TAG],
  { revalidate: false, tags: [SETTINGS_CACHE_TAG] }
)

export async function getSetting(key: string): Promise<string> {
  const all = await getAllSettings()
  return all[key] ?? ""
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const all = await getAllSettings()
  const result: Record<string, string> = {}
  for (const key of keys) {
    result[key] = all[key] ?? ""
  }
  return result
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function setSettings(entries: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(entries).map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )
}

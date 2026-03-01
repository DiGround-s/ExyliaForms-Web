import { getSettings } from "./settings"

export interface FormEmbedConfig {
  received?: { title?: string; description?: string; footer?: string; color?: string }
  accepted?: { title?: string; description?: string; footer?: string; color?: string }
  rejected?: { title?: string; description?: string; cooldown?: string; footer?: string; color?: string }
}

const DISCORD_API = "https://discord.com/api/v10"
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

function appUrl(): string {
  try {
    return new URL(process.env.AUTH_URL ?? "http://localhost:3000").origin
  } catch {
    return "http://localhost:3000"
  }
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

function hexToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16) || 0
}

async function openDMChannel(discordUserId: string): Promise<string> {
  const res = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: "POST",
    headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: discordUserId }),
  })
  if (!res.ok) throw new Error(`DM channel error: ${res.status}`)
  return ((await res.json()) as { id: string }).id
}

async function sendMessage(channelId: string, payload: object): Promise<void> {
  await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

function dispatch(discordUserId: string | null | undefined, buildPayload: () => Promise<object>): void {
  if (!BOT_TOKEN || !discordUserId) return
  ;(async () => {
    try {
      const [channelId, payload] = await Promise.all([openDMChannel(discordUserId), buildPayload()])
      await sendMessage(channelId, payload)
    } catch {}
  })()
}

export function notifySubmissionReceived({
  discordUserId,
  formTitle,
  submissionId,
  embedConfig,
}: {
  discordUserId: string | null | undefined
  formTitle: string
  submissionId: string
  embedConfig?: FormEmbedConfig | null
}): void {
  const link = `${appUrl()}/app/submissions/${submissionId}`
  const date = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })

  dispatch(discordUserId, async () => {
    const s = await getSettings([
      "dm_received_title", "dm_received_description", "dm_received_footer", "dm_received_color",
    ])
    const ov = embedConfig?.received
    const vars = { formTitle, date }
    const footer = ov?.footer ?? s.dm_received_footer
    return {
      embeds: [{
        title: fill(ov?.title || s.dm_received_title, vars),
        description: fill(ov?.description || s.dm_received_description, vars),
        color: hexToInt(ov?.color || s.dm_received_color),
        fields: [
          { name: "📅 Fecha de envío", value: date, inline: true },
          { name: "🔗 Ver mi respuesta", value: `[Haz clic aquí](${link})`, inline: false },
        ],
        footer: footer ? { text: fill(footer, vars) } : undefined,
      }],
    }
  })
}

export function notifySubmissionStatusChanged({
  discordUserId,
  formTitle,
  submissionId,
  status,
  cooldownDays,
  embedConfig,
}: {
  discordUserId: string | null | undefined
  formTitle: string
  submissionId: string
  status: "ACCEPTED" | "REJECTED"
  cooldownDays: number | null
  embedConfig?: FormEmbedConfig | null
}): void {
  const link = `${appUrl()}/app/submissions/${submissionId}`

  if (status === "ACCEPTED") {
    dispatch(discordUserId, async () => {
      const s = await getSettings([
        "dm_accepted_title", "dm_accepted_description", "dm_accepted_footer", "dm_accepted_color",
      ])
      const ov = embedConfig?.accepted
      const vars = { formTitle }
      const footer = ov?.footer ?? s.dm_accepted_footer
      return {
        embeds: [{
          title: fill(ov?.title || s.dm_accepted_title, vars),
          description: fill(ov?.description || s.dm_accepted_description, vars),
          color: hexToInt(ov?.color || s.dm_accepted_color),
          fields: [{ name: "🔗 Ver mi respuesta", value: `[Haz clic aquí](${link})`, inline: false }],
          footer: footer ? { text: fill(footer, vars) } : undefined,
        }],
      }
    })
    return
  }

  dispatch(discordUserId, async () => {
    const s = await getSettings([
      "dm_rejected_title", "dm_rejected_description", "dm_rejected_cooldown",
      "dm_rejected_footer", "dm_rejected_color",
    ])
    const ov = embedConfig?.rejected
    const vars = { formTitle, cooldownDays: String(cooldownDays ?? "") }
    const cooldownTemplate = ov?.cooldown ?? s.dm_rejected_cooldown
    const cooldownField =
      cooldownDays != null && cooldownDays > 0 && cooldownTemplate
        ? [{ name: "⏳ Tiempo de espera", value: fill(cooldownTemplate, vars), inline: false }]
        : []
    const footer = ov?.footer ?? s.dm_rejected_footer
    return {
      embeds: [{
        title: fill(ov?.title || s.dm_rejected_title, vars),
        description: fill(ov?.description || s.dm_rejected_description, vars),
        color: hexToInt(ov?.color || s.dm_rejected_color),
        fields: [
          ...cooldownField,
          { name: "🔗 Ver mi respuesta", value: `[Haz clic aquí](${link})`, inline: false },
        ],
        footer: footer ? { text: fill(footer, vars) } : undefined,
      }],
    }
  })
}

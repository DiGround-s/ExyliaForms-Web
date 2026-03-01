import { getSettings } from "./settings"

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
}: {
  discordUserId: string | null | undefined
  formTitle: string
  submissionId: string
}): void {
  const link = `${appUrl()}/app/submissions/${submissionId}`
  const date = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })

  dispatch(discordUserId, async () => {
    const s = await getSettings([
      "dm_received_title", "dm_received_description", "dm_received_footer", "dm_received_color",
    ])
    const vars = { formTitle, date }
    return {
      embeds: [{
        title: fill(s.dm_received_title, vars),
        description: fill(s.dm_received_description, vars),
        color: hexToInt(s.dm_received_color),
        fields: [
          { name: "📅 Fecha de envío", value: date, inline: true },
          { name: "🔗 Ver mi respuesta", value: `[Haz clic aquí](${link})`, inline: false },
        ],
        footer: s.dm_received_footer ? { text: fill(s.dm_received_footer, vars) } : undefined,
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
}: {
  discordUserId: string | null | undefined
  formTitle: string
  submissionId: string
  status: "ACCEPTED" | "REJECTED"
  cooldownDays: number | null
}): void {
  const link = `${appUrl()}/app/submissions/${submissionId}`

  if (status === "ACCEPTED") {
    dispatch(discordUserId, async () => {
      const s = await getSettings([
        "dm_accepted_title", "dm_accepted_description", "dm_accepted_footer", "dm_accepted_color",
      ])
      const vars = { formTitle }
      return {
        embeds: [{
          title: fill(s.dm_accepted_title, vars),
          description: fill(s.dm_accepted_description, vars),
          color: hexToInt(s.dm_accepted_color),
          fields: [{ name: "🔗 Ver mi respuesta", value: `[Haz clic aquí](${link})`, inline: false }],
          footer: s.dm_accepted_footer ? { text: fill(s.dm_accepted_footer, vars) } : undefined,
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
    const vars = { formTitle, cooldownDays: String(cooldownDays ?? "") }
    const cooldownField =
      cooldownDays != null && cooldownDays > 0 && s.dm_rejected_cooldown
        ? [{ name: "⏳ Tiempo de espera", value: fill(s.dm_rejected_cooldown, vars), inline: false }]
        : []
    return {
      embeds: [{
        title: fill(s.dm_rejected_title, vars),
        description: fill(s.dm_rejected_description, vars),
        color: hexToInt(s.dm_rejected_color),
        fields: [
          ...cooldownField,
          { name: "🔗 Ver mi respuesta", value: `[Haz clic aquí](${link})`, inline: false },
        ],
        footer: s.dm_rejected_footer ? { text: fill(s.dm_rejected_footer, vars) } : undefined,
      }],
    }
  })
}

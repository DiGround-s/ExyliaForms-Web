import { getSettings } from "./settings"

export interface FormEmbedConfig {
  received?: { title?: string; description?: string; footer?: string; color?: string }
  accepted?: { title?: string; description?: string; footer?: string; color?: string }
  rejected?: { title?: string; description?: string; cooldown?: string; footer?: string; color?: string }
  joinOnAcceptEnabled?: boolean
  acceptServers?: Array<{ guildId?: string; roleIds?: string[] }>
  logChannelId?: string
  logAcceptedMessage?: string
  logRejectedMessage?: string
}

const DEFAULT_LOG_ACCEPTED = "✅ **{{globalName}}** (`{{username}}`) ha sido **aceptado** en **{{formTitle}}**"
const DEFAULT_LOG_REJECTED = "❌ **{{globalName}}** (`{{username}}`) ha sido **rechazado** en **{{formTitle}}**"

export interface DiscordConfigIssue {
  guildId: string
  roleId?: string
  code: string
  message: string
}

const DISCORD_API = "https://discord.com/api/v10"
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const MANAGE_ROLES_PERMISSION = BigInt("268435456")

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

async function addMemberToGuild(guildId: string, discordUserId: string, userAccessToken: string): Promise<void> {
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}`, {
    method: "PUT",
    headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: userAccessToken }),
  })
  if (!res.ok) {
    const details = await res.text().catch(() => "")
    throw new Error(`Guild member add error: ${res.status} ${details}`)
  }
}

async function addRoleToMember(guildId: string, discordUserId: string, roleId: string): Promise<void> {
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
    method: "PUT",
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  })
  if (!res.ok) {
    const details = await res.text().catch(() => "")
    throw new Error(`Role add error: ${res.status} ${details}`)
  }
}

async function fetchBotUserId(): Promise<string | null> {
  if (!BOT_TOKEN) return null
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { id?: string }
  return data.id ?? null
}

interface DiscordRole {
  id: string
  name: string
  managed: boolean
  permissions: string
  position: number
}

interface DiscordGuildMember {
  roles: string[]
}

export async function validateDiscordJoinConfig(embedConfig?: FormEmbedConfig | null): Promise<DiscordConfigIssue[]> {
  const isEnabled = embedConfig?.joinOnAcceptEnabled
  const servers = (embedConfig?.acceptServers ?? [])
    .map((s) => ({
      guildId: (s.guildId ?? "").trim(),
      roleIds: Array.from(new Set((s.roleIds ?? []).map((id) => id.trim()).filter(Boolean))),
    }))
    .filter((s) => Boolean(s.guildId))

  if (!isEnabled || servers.length === 0) return []

  if (!BOT_TOKEN) {
    return [{ guildId: "*", code: "MISSING_BOT_TOKEN", message: "Discord bot token is missing (DISCORD_BOT_TOKEN)." }]
  }

  const botUserId = await fetchBotUserId()
  if (!botUserId) {
    return [{ guildId: "*", code: "INVALID_BOT_TOKEN", message: "Discord bot token is invalid or unauthorized." }]
  }

  const issues: DiscordConfigIssue[] = []

  for (const server of servers) {
    const guildRes = await fetch(`${DISCORD_API}/guilds/${server.guildId}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    })
    if (!guildRes.ok) {
      issues.push({
        guildId: server.guildId,
        code: "UNKNOWN_GUILD",
        message: `Server ${server.guildId}: the bot cannot access this guild (Unknown Guild or not invited).`,
      })
      continue
    }

    const [rolesRes, botMemberRes] = await Promise.all([
      fetch(`${DISCORD_API}/guilds/${server.guildId}/roles`, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      }),
      fetch(`${DISCORD_API}/guilds/${server.guildId}/members/${botUserId}`, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      }),
    ])

    if (!rolesRes.ok) {
      issues.push({
        guildId: server.guildId,
        code: "ROLES_ACCESS_FAILED",
        message: `Server ${server.guildId}: unable to read guild roles with current bot permissions.`,
      })
      continue
    }

    if (!botMemberRes.ok) {
      issues.push({
        guildId: server.guildId,
        code: "BOT_NOT_IN_GUILD",
        message: `Server ${server.guildId}: bot member is not available in this guild.`,
      })
      continue
    }

    const roles = (await rolesRes.json()) as DiscordRole[]
    const botMember = (await botMemberRes.json()) as DiscordGuildMember
    const botRoles = roles.filter((role) => botMember.roles.includes(role.id))
    const botTopPosition = botRoles.reduce((max, role) => Math.max(max, role.position), 0)
    const hasManageRoles = botRoles.some((role) => (BigInt(role.permissions) & MANAGE_ROLES_PERMISSION) === MANAGE_ROLES_PERMISSION)

    if (!hasManageRoles && server.roleIds.length > 0) {
      issues.push({
        guildId: server.guildId,
        code: "MISSING_MANAGE_ROLES",
        message: `Server ${server.guildId}: bot is missing Manage Roles permission.`,
      })
    }

    for (const roleId of server.roleIds) {
      const role = roles.find((r) => r.id === roleId)
      if (!role) {
        issues.push({
          guildId: server.guildId,
          roleId,
          code: "ROLE_NOT_FOUND",
          message: `Server ${server.guildId}: role ${roleId} was not found.`,
        })
        continue
      }

      if (role.managed) {
        issues.push({
          guildId: server.guildId,
          roleId,
          code: "ROLE_MANAGED",
          message: `Server ${server.guildId}: role ${roleId} is managed by an integration and cannot be assigned manually.`,
        })
        continue
      }

      if (!hasManageRoles) continue

      if (role.position >= botTopPosition) {
        issues.push({
          guildId: server.guildId,
          roleId,
          code: "ROLE_HIERARCHY",
          message: `Server ${server.guildId}: role ${roleId} is above or equal to the bot's highest role.`,
        })
      }
    }
  }

  return issues
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

export async function syncAcceptedDiscordMembership({
  discordUserId,
  userAccessToken,
  embedConfig,
}: {
  discordUserId: string | null | undefined
  userAccessToken: string | null | undefined
  embedConfig?: FormEmbedConfig | null
}): Promise<void> {
  const isEnabled = embedConfig?.joinOnAcceptEnabled
  const rawServers = embedConfig?.acceptServers ?? []
  const servers = rawServers
    .map((s) => ({
      guildId: (s.guildId ?? "").trim(),
      roleIds: Array.from(new Set((s.roleIds ?? []).map((id) => id.trim()).filter(Boolean))),
    }))
    .filter((s) => Boolean(s.guildId))

  if (!BOT_TOKEN || !discordUserId || !userAccessToken || !isEnabled || servers.length === 0) return

  for (const server of servers) {
    try {
      await addMemberToGuild(server.guildId, discordUserId, userAccessToken)
      for (const roleId of server.roleIds) {
        await addRoleToMember(server.guildId, discordUserId, roleId)
      }
    } catch (error) {
      console.error("Discord membership sync failed", {
        guildId: server.guildId,
        discordUserId,
        error,
      })
    }
  }
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

export function logSubmissionStatusToChannel({
  status,
  formTitle,
  submissionId,
  username,
  globalName,
  embedConfig,
}: {
  status: "ACCEPTED" | "REJECTED"
  formTitle: string
  submissionId: string
  username: string | null
  globalName: string | null
  embedConfig?: FormEmbedConfig | null
}): void {
  const channelId = embedConfig?.logChannelId?.trim()
  if (!BOT_TOKEN || !channelId) return

  const vars = {
    formTitle,
    submissionId,
    username: username ?? "unknown",
    globalName: globalName ?? username ?? "unknown",
    date: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }),
  }

  const template =
    status === "ACCEPTED"
      ? (embedConfig?.logAcceptedMessage?.trim() || DEFAULT_LOG_ACCEPTED)
      : (embedConfig?.logRejectedMessage?.trim() || DEFAULT_LOG_REJECTED)

  const content = fill(template, vars)
  const link = `${appUrl()}/admin/forms/${submissionId.split("-")[0]}/submissions`

  ;(async () => {
    try {
      await sendMessage(channelId, {
        content,
        embeds: [{
          color: status === "ACCEPTED" ? hexToInt("#57F287") : hexToInt("#ED4245"),
          fields: [
            { name: "Formulario", value: formTitle, inline: true },
            { name: "Usuario", value: globalName ?? username ?? "—", inline: true },
            { name: "🔗 Ver respuesta", value: `[Abrir panel](${appUrl()}/admin/forms)`, inline: false },
          ],
          timestamp: new Date().toISOString(),
        }],
      })
    } catch {}
  })()
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

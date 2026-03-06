import { auth } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/auth-utils"
import { type FormEmbedConfig, validateDiscordJoinConfig } from "@/lib/discord"
import { prisma } from "@/lib/prisma"
import { getSettings } from "@/lib/settings"
import { Prisma } from "@prisma/client"
import { z } from "zod"

const embedOverrideSchema = z.object({
  title: z.string().max(256).optional(),
  description: z.string().max(4096).optional(),
  footer: z.string().max(2048).optional(),
  color: z.string().max(7).optional(),
  cooldown: z.string().max(512).optional(),
}).optional()

const snowflakeSchema = z.string().regex(/^\d{17,20}$/)

const updateFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  maxSubmissionsPerUser: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  icon: z.string().nullable().optional(),
  reapplyCooldownDays: z.number().int().min(1).nullable().optional(),
  dmEmbedConfig: z.object({
    received: embedOverrideSchema,
    accepted: embedOverrideSchema,
    rejected: embedOverrideSchema,
    joinOnAcceptEnabled: z.boolean().optional(),
    acceptServers: z.array(z.object({
      guildId: snowflakeSchema,
      roleIds: z.array(snowflakeSchema).optional(),
    })).optional(),
    logChannelId: snowflakeSchema.optional(),
    logReceivedChannelId: snowflakeSchema.optional(),
    logReceivedMessage: z.string().max(2000).optional(),
    logAcceptedMessage: z.string().max(2000).optional(),
    logRejectedMessage: z.string().max(2000).optional(),
  }).nullable().optional(),
})

async function requireAdmin() {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) return null
  return session
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const [form, dmDefaults] = await Promise.all([
    prisma.form.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { order: "asc" } },
        sections: { orderBy: { order: "asc" } },
        _count: { select: { submissions: true } },
      },
    }),
    getSettings([
      "dm_received_title",
      "dm_received_description",
      "dm_received_footer",
      "dm_received_color",
      "dm_accepted_title",
      "dm_accepted_description",
      "dm_accepted_footer",
      "dm_accepted_color",
      "dm_rejected_title",
      "dm_rejected_description",
      "dm_rejected_cooldown",
      "dm_rejected_footer",
      "dm_rejected_color",
    ]),
  ])

  if (!form) return Response.json({ error: "Not found" }, { status: 404 })

  return Response.json({
    ...form,
    globalDmDefaults: {
      received: {
        title: dmDefaults.dm_received_title,
        description: dmDefaults.dm_received_description,
        footer: dmDefaults.dm_received_footer,
        color: dmDefaults.dm_received_color,
      },
      accepted: {
        title: dmDefaults.dm_accepted_title,
        description: dmDefaults.dm_accepted_description,
        footer: dmDefaults.dm_accepted_footer,
        color: dmDefaults.dm_accepted_color,
      },
      rejected: {
        title: dmDefaults.dm_rejected_title,
        description: dmDefaults.dm_rejected_description,
        cooldown: dmDefaults.dm_rejected_cooldown,
        footer: dmDefaults.dm_rejected_footer,
        color: dmDefaults.dm_rejected_color,
      },
    },
  })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = updateFormSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
  }

  const { dmEmbedConfig, ...rest } = parsed.data
  if (dmEmbedConfig) {
    const issues = await validateDiscordJoinConfig(dmEmbedConfig as FormEmbedConfig)
    if (issues.length > 0) {
      return Response.json(
        { error: "Discord configuration validation failed", issues },
        { status: 400 },
      )
    }
  }

  const form = await prisma.form.update({
    where: { id },
    data: {
      ...rest,
      ...(dmEmbedConfig !== undefined
        ? { dmEmbedConfig: dmEmbedConfig ?? Prisma.JsonNull }
        : {}),
    },
  })

  return Response.json(form)
}

import { auth } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { notifySubmissionStatusChanged, syncAcceptedDiscordMembership, type FormEmbedConfig } from "@/lib/discord"
import { z } from "zod"
import { SubmissionStatus } from "@prisma/client"

const schema = z.object({
  status: z.nativeEnum(SubmissionStatus),
})

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"

async function getDiscordAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "discord" },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
    orderBy: { expires_at: "desc" },
  })

  if (!account?.access_token) return null

  const now = Math.floor(Date.now() / 1000)
  const isExpired = typeof account.expires_at === "number" && account.expires_at <= now + 30
  if (!isExpired) return account.access_token

  if (!account.refresh_token || !process.env.AUTH_DISCORD_ID || !process.env.AUTH_DISCORD_SECRET) {
    return account.access_token
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: account.refresh_token,
  })

  const res = await fetch(DISCORD_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${process.env.AUTH_DISCORD_ID}:${process.env.AUTH_DISCORD_SECRET}`).toString("base64")}`,
    },
    body,
  })

  if (!res.ok) {
    return account.access_token
  }

  const refreshed = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }

  if (!refreshed.access_token) return account.access_token

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? account.refresh_token,
      expires_at: refreshed.expires_in ? now + refreshed.expires_in : account.expires_at,
    },
  })

  return refreshed.access_token
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json(parsed.error, { status: 400 })

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      user: { select: { id: true, discordId: true } },
      form: { select: { title: true, reapplyCooldownDays: true, dmEmbedConfig: true } },
    },
  })
  if (!submission) return Response.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.submission.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  const newStatus = parsed.data.status
  if (newStatus === "ACCEPTED" || newStatus === "REJECTED") {
    if (newStatus === "ACCEPTED") {
      const accessToken = await getDiscordAccessToken(submission.user.id)

      await syncAcceptedDiscordMembership({
        discordUserId: submission.user.discordId,
        userAccessToken: accessToken,
        embedConfig: submission.form.dmEmbedConfig as FormEmbedConfig | null,
      })
    }

    notifySubmissionStatusChanged({
      discordUserId: submission.user.discordId,
      formTitle: submission.form.title,
      submissionId: id,
      status: newStatus,
      cooldownDays: newStatus === "REJECTED" ? (submission.form.reapplyCooldownDays ?? null) : null,
      embedConfig: submission.form.dmEmbedConfig as FormEmbedConfig | null,
    })
  }

  return Response.json({ status: updated.status })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const submission = await prisma.submission.findUnique({ where: { id }, select: { id: true } })
  if (!submission) return Response.json({ error: "Not found" }, { status: 404 })

  await prisma.submission.delete({ where: { id } })
  return new Response(null, { status: 204 })
}

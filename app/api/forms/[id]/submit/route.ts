import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hashIp } from "@/lib/hash"
import { checkRateLimit } from "@/lib/rate-limit"
import { notifySubmissionReceived, type FormEmbedConfig } from "@/lib/discord"
import { z } from "zod"

const submitSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  })
  if (!userExists) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"

  const rateLimitKey = `submit:${session.user.id}:${id}`
  const ipKey = `submit-ip:${ip}:${id}`
  const userCheck = checkRateLimit(rateLimitKey)
  const ipCheck = checkRateLimit(ipKey)

  if (!userCheck.allowed || !ipCheck.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 })
  }

  const form = await prisma.form.findUnique({
    where: { id },
    include: { fields: { orderBy: { order: "asc" } } },
  })

  if (!form || form.status !== "PUBLISHED" || !form.isActive) {
    return Response.json({ error: "Form not available" }, { status: 404 })
  }

  const unlock = await prisma.formUserUnlock.findUnique({
    where: { formId_userId: { formId: id, userId: session.user.id } },
  })

  if (!unlock) {
    if (form.maxSubmissionsPerUser) {
      const count = await prisma.submission.count({
        where: { formId: id, userId: session.user.id },
      })
      if (count >= form.maxSubmissionsPerUser) {
        return Response.json({ error: "Submission limit reached" }, { status: 400 })
      }
    }

    if (form.reapplyCooldownDays) {
      const last = await prisma.submission.findFirst({
        where: { formId: id, userId: session.user.id, status: { in: ["ACCEPTED", "REJECTED"] } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, status: true },
      })
      if (last) {
        const daysSince = (Date.now() - last.createdAt.getTime()) / 86400000
        if (daysSince < form.reapplyCooldownDays) {
          const daysLeft = Math.ceil(form.reapplyCooldownDays - daysSince)
          return Response.json(
            { error: `Debes esperar ${daysLeft} día${daysLeft !== 1 ? "s" : ""} para volver a aplicar` },
            { status: 400 }
          )
        }
      }
    }
  }

  const body = await req.json().catch(() => null)
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 })
  }

  const { answers } = parsed.data

  for (const field of form.fields) {
    const value = answers[field.key]
    if (field.required && (value === undefined || value === null || value === "")) {
      return Response.json({ error: `Field "${field.label}" is required` }, { status: 400 })
    }
  }

  const submission = await prisma.submission.create({
    data: {
      formId: id,
      userId: session.user.id,
      ipHash: hashIp(ip),
      userAgent: req.headers.get("user-agent") ?? null,
      answers: {
        create: form.fields
          .filter((f) => answers[f.key] !== undefined)
          .map((f) => ({
            fieldId: f.id,
            valueJson: answers[f.key] as object,
          })),
      },
    },
  })

  if (unlock) {
    await prisma.formUserUnlock.delete({ where: { formId_userId: { formId: id, userId: session.user.id } } })
  }

  notifySubmissionReceived({
    discordUserId: session.user.discordId,
    formTitle: form.title,
    submissionId: submission.id,
    embedConfig: form.dmEmbedConfig as FormEmbedConfig | null,
  })

  return Response.json({ id: submission.id }, { status: 201 })
}

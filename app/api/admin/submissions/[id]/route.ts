import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifySubmissionStatusChanged } from "@/lib/discord"
import { z } from "zod"
import { SubmissionStatus } from "@prisma/client"

const schema = z.object({
  status: z.nativeEnum(SubmissionStatus),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
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
      user: { select: { discordId: true } },
      form: { select: { title: true, reapplyCooldownDays: true } },
    },
  })
  if (!submission) return Response.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.submission.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  const newStatus = parsed.data.status
  if (newStatus === "ACCEPTED" || newStatus === "REJECTED") {
    notifySubmissionStatusChanged({
      discordUserId: submission.user.discordId,
      formTitle: submission.form.title,
      submissionId: id,
      status: newStatus,
      cooldownDays: newStatus === "REJECTED" ? (submission.form.reapplyCooldownDays ?? null) : null,
    })
  }

  return Response.json({ status: updated.status })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const submission = await prisma.submission.findUnique({ where: { id }, select: { id: true } })
  if (!submission) return Response.json({ error: "Not found" }, { status: 404 })

  await prisma.submission.delete({ where: { id } })
  return new Response(null, { status: 204 })
}

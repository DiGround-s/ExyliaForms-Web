import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

  const submission = await prisma.submission.findUnique({ where: { id }, select: { id: true } })
  if (!submission) return Response.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.submission.update({
    where: { id },
    data: { status: parsed.data.status },
  })

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

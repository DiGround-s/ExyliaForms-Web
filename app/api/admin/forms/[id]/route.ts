import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  maxSubmissionsPerUser: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  icon: z.string().nullable().optional(),
  reapplyCooldownDays: z.number().int().min(1).nullable().optional(),
})

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const form = await prisma.form.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
      _count: { select: { submissions: true } },
    },
  })

  if (!form) return Response.json({ error: "Not found" }, { status: 404 })

  return Response.json(form)
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

  const form = await prisma.form.update({ where: { id }, data: parsed.data })

  return Response.json(form)
}

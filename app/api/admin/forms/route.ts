import { auth } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const forms = await prisma.form.findMany({
    include: {
      _count: { select: { submissions: true, fields: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(forms)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createFormSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
  }

  const form = await prisma.form.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      createdByUserId: session.user.id,
    },
  })

  return Response.json(form, { status: 201 })
}

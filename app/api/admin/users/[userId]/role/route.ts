import { auth } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  role: z.enum(["USER", "ADMIN"]),
})

export async function PUT(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth()
  if (!session || !isSuperAdmin(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await params

  if (userId === session.user.id) {
    return Response.json({ error: "Cannot change your own role" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Invalid" }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
  if (!target) return Response.json({ error: "Not found" }, { status: 404 })

  if (target.role === "SUPERADMIN") {
    return Response.json({ error: "Cannot change SuperAdmin role" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
    select: { id: true, role: true },
  })

  return Response.json({ role: updated.role })
}

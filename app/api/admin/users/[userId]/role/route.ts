import { auth } from "@/lib/auth"
import { hasAdminAccess, isSuperAdmin } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  role: z.enum(["USER", "REVIEWER", "ADMIN", "SUPERADMIN"]),
})

export async function PUT(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const actorIsSuperAdmin = isSuperAdmin(session.user.role)
  const { userId } = await params

  if (userId === session.user.id) {
    return Response.json({ error: "Cannot change your own role" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Invalid" }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
  if (!target) return Response.json({ error: "Not found" }, { status: 404 })

  if (!actorIsSuperAdmin && target.role === "SUPERADMIN") {
    return Response.json({ error: "Cannot change SuperAdmin role" }, { status: 400 })
  }

  if (!actorIsSuperAdmin) {
    if (target.role === "ADMIN") {
      return Response.json({ error: "Admins cannot change other Admin roles" }, { status: 403 })
    }
    if (parsed.data.role === "ADMIN" || parsed.data.role === "SUPERADMIN") {
      return Response.json({ error: "Admins cannot grant Admin or SuperAdmin role" }, { status: 403 })
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
    select: { id: true, role: true },
  })

  return Response.json({ role: updated.role })
}

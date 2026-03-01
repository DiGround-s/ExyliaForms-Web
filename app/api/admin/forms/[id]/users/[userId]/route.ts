import { auth } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({ unlocked: z.boolean() })

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: formId, userId } = await params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Invalid" }, { status: 400 })

  if (parsed.data.unlocked) {
    await prisma.formUserUnlock.upsert({
      where: { formId_userId: { formId, userId } },
      create: { formId, userId },
      update: {},
    })
  } else {
    await prisma.formUserUnlock.deleteMany({ where: { formId, userId } })
  }

  return Response.json({ unlocked: parsed.data.unlocked })
}

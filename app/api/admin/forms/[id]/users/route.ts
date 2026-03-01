import { auth } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: formId } = await params

  const [submissions, unlocks] = await Promise.all([
    prisma.submission.findMany({
      where: { formId },
      include: {
        user: { select: { id: true, discordId: true, username: true, globalName: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.formUserUnlock.findMany({ where: { formId }, select: { userId: true } }),
  ])

  const unlockedIds = new Set(unlocks.map((u) => u.userId))

  const byUser = new Map<string, {
    user: (typeof submissions)[0]["user"]
    count: number
    lastStatus: string
    lastDate: string
    unlocked: boolean
  }>()

  for (const s of submissions) {
    if (!byUser.has(s.userId)) {
      byUser.set(s.userId, {
        user: s.user,
        count: 0,
        lastStatus: s.status,
        lastDate: s.createdAt.toISOString(),
        unlocked: unlockedIds.has(s.userId),
      })
    }
    byUser.get(s.userId)!.count++
  }

  return Response.json(Array.from(byUser.values()))
}

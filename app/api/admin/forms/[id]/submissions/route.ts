import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: formId } = await params

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())

  const [submissions, total, pending, accepted, rejected, today, week] = await Promise.all([
    prisma.submission.findMany({
      where: { formId },
      include: {
        user: { select: { discordId: true, username: true, globalName: true, image: true } },
        answers: {
          include: { field: { select: { key: true, label: true, section: { select: { title: true } } } } },
          orderBy: { field: { order: "asc" } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.count({ where: { formId } }),
    prisma.submission.count({ where: { formId, status: "PENDING" } }),
    prisma.submission.count({ where: { formId, status: "ACCEPTED" } }),
    prisma.submission.count({ where: { formId, status: "REJECTED" } }),
    prisma.submission.count({ where: { formId, createdAt: { gte: startOfToday } } }),
    prisma.submission.count({ where: { formId, createdAt: { gte: startOfWeek } } }),
  ])

  return Response.json({ submissions, stats: { total, pending, accepted, rejected, today, week } })
}

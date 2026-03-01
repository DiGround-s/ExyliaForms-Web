import { auth } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)

  const [
    totalForms,
    publishedForms,
    draftForms,
    totalSubmissions,
    pendingSubmissions,
    acceptedSubmissions,
    rejectedSubmissions,
    totalUsers,
    topForms,
    dailyRaw,
  ] = await Promise.all([
    prisma.form.count(),
    prisma.form.count({ where: { status: "PUBLISHED" } }),
    prisma.form.count({ where: { status: "DRAFT" } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: "PENDING" } }),
    prisma.submission.count({ where: { status: "ACCEPTED" } }),
    prisma.submission.count({ where: { status: "REJECTED" } }),
    prisma.user.count(),
    prisma.form.findMany({
      take: 8,
      orderBy: { submissions: { _count: "desc" } },
      select: {
        title: true,
        icon: true,
        _count: { select: { submissions: true } },
      },
    }),
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt") as day, COUNT(*) as count
      FROM submissions
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `,
  ])

  const daily = dailyRaw.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    count: Number(r.count),
  }))

  return Response.json({
    forms: { total: totalForms, published: publishedForms, draft: draftForms },
    submissions: {
      total: totalSubmissions,
      pending: pendingSubmissions,
      accepted: acceptedSubmissions,
      rejected: rejectedSubmissions,
    },
    users: totalUsers,
    topForms: topForms.map((f) => ({ title: f.title, icon: f.icon, count: f._count.submissions })),
    daily,
  })
}

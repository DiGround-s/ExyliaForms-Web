import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { FileText, Users, CheckSquare, Clock, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCharts } from "@/components/admin/stats-charts"

export default async function StatsPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/app/forms")

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
      select: { title: true, icon: true, _count: { select: { submissions: true } } },
    }),
    prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt") as day, COUNT(*) as count
      FROM submissions
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `,
  ])

  const data = {
    forms: { total: totalForms, published: publishedForms, draft: draftForms },
    submissions: {
      total: totalSubmissions,
      pending: pendingSubmissions,
      accepted: acceptedSubmissions,
      rejected: rejectedSubmissions,
    },
    users: totalUsers,
    topForms: topForms.map((f) => ({ title: f.title, icon: f.icon, count: f._count.submissions })),
    daily: dailyRaw.map((r) => ({ day: r.day.toISOString().slice(0, 10), count: Number(r.count) })),
  }

  const overviewCards = [
    { label: "Formularios", value: totalForms, sub: `${publishedForms} publicados · ${draftForms} borradores`, icon: FileText },
    { label: "Usuarios", value: totalUsers, sub: "registrados", icon: Users },
    { label: "Pendientes", value: pendingSubmissions, sub: `de ${totalSubmissions} total`, icon: Clock, color: "text-yellow-500" },
    { label: "Aceptados", value: acceptedSubmissions, sub: `de ${totalSubmissions} total`, icon: CheckCircle, color: "text-green-500" },
    { label: "Rechazados", value: rejectedSubmissions, sub: `de ${totalSubmissions} total`, icon: XCircle, color: "text-red-500" },
    { label: "Total respuestas", value: totalSubmissions, sub: "todas las formas", icon: CheckSquare },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estadísticas</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color ?? "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <StatsCharts data={data} />
    </div>
  )
}

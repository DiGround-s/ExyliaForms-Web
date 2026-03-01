import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FileText, Users, CheckSquare, Bell, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function AdminDashboard() {
  const [publishedCount, totalSubmissions, unreadCount, usersCount, recentSubmissions] = await Promise.all([
    prisma.form.count({ where: { status: "PUBLISHED" } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { globalName: true, username: true, discordId: true, image: true } },
        form: { select: { title: true, id: true } },
      },
    }),
  ])

  const stats = [
    { label: "Publicados", value: publishedCount, icon: FileText },
    { label: "Respuestas", value: totalSubmissions, icon: CheckSquare },
    { label: "Pendientes", value: unreadCount, icon: Bell },
    { label: "Usuarios", value: usersCount, icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/forms/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo formulario
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Últimas respuestas</h2>
        {recentSubmissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay respuestas aún.</p>
        ) : (
          <div className="space-y-2">
            {recentSubmissions.map((sub) => {
              const name = sub.user.globalName ?? sub.user.username ?? sub.user.discordId ?? "Usuario"
              const initial = name[0]?.toUpperCase() ?? "U"
              return (
                <Card key={sub.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sub.user.image ?? undefined} />
                        <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">{sub.form.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.status === "PENDING" && <Badge variant="secondary">Pendiente</Badge>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleString()}
                      </p>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/forms/${sub.form.id}/submissions`}>Ver</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

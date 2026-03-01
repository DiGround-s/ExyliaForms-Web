import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserSubmissions } from "@/components/admin/user-submissions"

interface Params {
  params: Promise<{ userId: string }>
}

export default async function AdminUserPage({ params }: Params) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      discordId: true,
      username: true,
      globalName: true,
      image: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  })

  if (!user) notFound()

  const submissions = await prisma.submission.findMany({
    where: { userId },
    include: {
      form: { select: { id: true, title: true, icon: true } },
      answers: {
        include: { field: { select: { key: true, label: true, section: { select: { title: true } } } } },
        orderBy: { field: { order: "asc" } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const name = user.globalName ?? user.username ?? user.discordId ?? "Usuario"
  const initial = name[0]?.toUpperCase() ?? "U"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Usuarios
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Detalle de usuario</h1>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-lg">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{name}</p>
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
            </div>
            {user.discordId && (
              <p className="text-sm text-muted-foreground">Discord ID: {user.discordId}</p>
            )}
            <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
              <span>Registro: {new Date(user.createdAt).toLocaleDateString()}</span>
              {user.lastLoginAt && (
                <span>Último acceso: {new Date(user.lastLoginAt).toLocaleString()}</span>
              )}
              <span>{submissions.length} {submissions.length === 1 ? "respuesta" : "respuestas"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {submissions.length === 0 ? (
        <Alert>
          <AlertDescription>Este usuario no ha enviado ninguna respuesta.</AlertDescription>
        </Alert>
      ) : (
        <UserSubmissions
          submissions={submissions.map((s) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/auth-utils"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserRoleToggle } from "@/components/admin/user-role-toggle"
import { UserSearchInput } from "@/components/admin/user-search-input"
import { Suspense } from "react"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const search = q?.trim() ?? ""

  const [session, users] = await Promise.all([
    auth(),
    prisma.user.findMany({
      orderBy: [
        {
          role: "desc",
        },
        { lastLoginAt: "desc" },
      ],
      where: search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { globalName: { contains: search, mode: "insensitive" } },
              { discordId: { contains: search } },
            ],
          }
        : undefined,
      select: {
        id: true,
        discordId: true,
        username: true,
        globalName: true,
        image: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { submissions: true } },
      },
    }),
  ])

  const actorRole = session?.user.role ?? "USER"
  const canManageRoles = actorRole === "ADMIN" || actorRole === "SUPERADMIN"

  const roleBadgeVariant = (role: string) => {
    if (role === "SUPERADMIN") return "default" as const
    if (role === "ADMIN") return "secondary" as const
    return "outline" as const
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{users.length} {search ? "encontrados" : "registrados"}</p>
        </div>
        <Suspense>
          <UserSearchInput />
        </Suspense>
      </div>

      {users.length === 0 ? (
        <Alert>
          <AlertDescription>No hay usuarios registrados aún.</AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Respuestas</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const name = user.globalName ?? user.username ?? user.discordId ?? "Usuario"
                const initial = name[0]?.toUpperCase() ?? "U"
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          {user.discordId && (
                            <p className="text-xs text-muted-foreground">ID: {user.discordId}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user._count.submissions}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManageRoles && user.id !== session?.user.id && (
                          <UserRoleToggle userId={user.id} currentRole={user.role} actorRole={actorRole} />
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/users/${user.id}`}>Ver respuestas</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

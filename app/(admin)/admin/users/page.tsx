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
import { UserSortHeader } from "@/components/admin/user-sort-header"
import { Suspense } from "react"
import type { Prisma } from "@prisma/client"

const VALID_SORTS = ["globalName", "role", "submissions", "lastLoginAt", "createdAt"] as const
type SortKey = (typeof VALID_SORTS)[number]

function buildOrderBy(sort: SortKey, dir: "asc" | "desc"): Prisma.UserOrderByWithRelationInput[] {
  if (sort === "submissions") return [{ submissions: { _count: dir } }]
  return [{ [sort]: dir }]
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string }>
}) {
  const { q, sort: rawSort, dir: rawDir } = await searchParams
  const search = q?.trim() ?? ""
  const sort: SortKey = VALID_SORTS.includes(rawSort as SortKey) ? (rawSort as SortKey) : "lastLoginAt"
  const dir: "asc" | "desc" = rawDir === "asc" ? "asc" : "desc"

  const [session, users] = await Promise.all([
    auth(),
    prisma.user.findMany({
      orderBy: buildOrderBy(sort, dir),
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
                <Suspense fallback={<TableHead>Usuario</TableHead>}>
                  <UserSortHeader label="Usuario" sortKey="globalName" currentSort={sort} currentDir={dir} />
                </Suspense>
                <Suspense fallback={<TableHead>Rol</TableHead>}>
                  <UserSortHeader label="Rol" sortKey="role" currentSort={sort} currentDir={dir} />
                </Suspense>
                <Suspense fallback={<TableHead>Respuestas</TableHead>}>
                  <UserSortHeader label="Respuestas" sortKey="submissions" currentSort={sort} currentDir={dir} />
                </Suspense>
                <Suspense fallback={<TableHead>Último acceso</TableHead>}>
                  <UserSortHeader label="Último acceso" sortKey="lastLoginAt" currentSort={sort} currentDir={dir} />
                </Suspense>
                <Suspense fallback={<TableHead>Registro</TableHead>}>
                  <UserSortHeader label="Registro" sortKey="createdAt" currentSort={sort} currentDir={dir} />
                </Suspense>
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
                      {user.lastLoginAt ? (
                        <div>
                          <p>{new Date(user.lastLoginAt).toLocaleDateString("es-ES")}</p>
                          <p className="text-xs">{new Date(user.lastLoginAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>
                        <p>{new Date(user.createdAt).toLocaleDateString("es-ES")}</p>
                        <p className="text-xs">{new Date(user.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
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

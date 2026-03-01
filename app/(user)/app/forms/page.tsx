import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Folder, FileText, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function FormsPage() {
  const [categories, uncategorizedCount] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { forms: { where: { status: "PUBLISHED" } } } },
      },
    }),
    prisma.form.count({ where: { status: "PUBLISHED", categoryId: null } }),
  ])

  const hasContent = categories.length > 0 || uncategorizedCount > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Formularios</h1>
        <p className="text-muted-foreground">Selecciona una categoría para ver los formularios disponibles.</p>
      </div>

      {!hasContent && (
        <Alert>
          <AlertDescription>No hay formularios disponibles en este momento.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                </div>
                <Badge variant="secondary">{cat._count.forms}</Badge>
              </div>
              {cat.description && (
                <CardDescription className="line-clamp-2">{cat.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs text-muted-foreground">
                {cat._count.forms === 1 ? "1 formulario" : `${cat._count.forms} formularios`}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={cat._count.forms > 0 ? "default" : "secondary"} disabled={cat._count.forms === 0}>
                <Link href={`/app/forms/${cat.slug}`}>
                  Ver formularios
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}

        {uncategorizedCount > 0 && (
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Sin categoría</CardTitle>
                </div>
                <Badge variant="secondary">{uncategorizedCount}</Badge>
              </div>
              <CardDescription className="line-clamp-2">Formularios sin categoría asignada.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs text-muted-foreground">
                {uncategorizedCount === 1 ? "1 formulario" : `${uncategorizedCount} formularios`}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/app/forms/sin-categoria">
                  Ver formularios
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ArrowRight, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getFormIcon } from "@/lib/form-icons"

interface Params {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params

  let categoryName: string
  let forms: Awaited<ReturnType<typeof prisma.form.findMany>>

  if (slug === "sin-categoria") {
    categoryName = "Sin categoría"
    forms = await prisma.form.findMany({
      where: { status: "PUBLISHED", categoryId: null },
      orderBy: { createdAt: "desc" },
    })
  } else {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        forms: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    if (!category) notFound()
    categoryName = category.name
    forms = category.forms
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/forms">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Categorías
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{categoryName}</h1>
          <p className="text-sm text-muted-foreground">{forms.length} formularios</p>
        </div>
      </div>

      {forms.length === 0 && (
        <Alert>
          <AlertDescription>No hay formularios disponibles en esta categoría.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => {
          const Icon = getFormIcon(form.icon)
          const active = form.isActive

          return (
            <Card key={form.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <CardTitle className="text-base">{form.title}</CardTitle>
                  </div>
                  <Badge variant={active ? "default" : "secondary"} className="shrink-0">
                    {active ? "Abierto" : "Cerrado"}
                  </Badge>
                </div>
                {form.description && (
                  <CardDescription className="line-clamp-2">{form.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter>
                {active ? (
                  <Button asChild className="w-full">
                    <Link href={`/app/form/${form.id}`}>
                      Responder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" variant="secondary" disabled>
                    <Lock className="mr-2 h-4 w-4" />
                    No disponible
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { FormRenderer } from "@/components/forms/form-renderer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getFormIcon } from "@/lib/form-icons"
import { Lock } from "lucide-react"

interface Params {
  params: Promise<{ id: string }>
}

export default async function FormPage({ params }: Params) {
  const session = await auth()
  const { id } = await params

  const form = await prisma.form.findUnique({
    where: { id, status: "PUBLISHED" },
    include: {
      fields: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
    },
  })

  if (!form) notFound()

  if (!form.isActive) {
    const Icon = getFormIcon(form.icon)
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{form.title}</h1>
          <Badge variant="secondary">Cerrado</Badge>
        </div>
        <Separator />
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Formulario no disponible</AlertTitle>
          <AlertDescription>Este formulario está temporalmente cerrado.</AlertDescription>
        </Alert>
      </div>
    )
  }

  let submissionCount = 0
  if (session && form.maxSubmissionsPerUser) {
    submissionCount = await prisma.submission.count({
      where: { formId: id, userId: session.user.id },
    })
  }

  const limitReached = form.maxSubmissionsPerUser
    ? submissionCount >= form.maxSubmissionsPerUser
    : false

  const Icon = getFormIcon(form.icon)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{form.title}</h1>
          <Badge variant={limitReached ? "secondary" : "default"}>
            {limitReached ? "Límite alcanzado" : "Abierto"}
          </Badge>
        </div>
        {form.description && (
          <p className="mt-2 text-muted-foreground">{form.description}</p>
        )}
      </div>

      <Separator />

      {limitReached && (
        <Alert variant="destructive">
          <AlertTitle>No disponible</AlertTitle>
          <AlertDescription>Ya alcanzaste el límite de respuestas para este formulario.</AlertDescription>
        </Alert>
      )}

      {!limitReached && form.fields.length === 0 && (
        <Alert>
          <AlertDescription>Este formulario no tiene campos configurados.</AlertDescription>
        </Alert>
      )}

      {!limitReached && form.fields.length > 0 && (
        <FormRenderer
          formId={form.id}
          sections={form.sections}
          fields={form.fields.map((f) => ({
            ...f,
            configJson: f.configJson as Record<string, unknown>,
          }))}
        />
      )}
    </div>
  )
}

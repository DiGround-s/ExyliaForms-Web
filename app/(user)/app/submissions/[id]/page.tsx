import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface Params {
  params: Promise<{ id: string }>
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (value === null || value === undefined || value === "") return "(Sin respuesta)"
  return String(value)
}

export default async function SubmissionDetailPage({ params }: Params) {
  const session = await auth()
  const { id } = await params

  const submission = await prisma.submission.findUnique({
    where: { id, userId: session!.user.id },
    include: {
      form: { select: { title: true, description: true } },
      answers: {
        include: { field: true },
        orderBy: { field: { order: "asc" } },
      },
    },
  })

  if (!submission) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/submissions">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{submission.form.title}</h1>
        {submission.form.description && (
          <p className="mt-1 text-muted-foreground">{submission.form.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Enviado el {new Date(submission.createdAt).toLocaleString()}
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        {submission.answers.map((answer) => (
          <Card key={answer.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{answer.field.label}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {answer.field.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-0 pb-3">
              <p className="text-sm">{formatValue(answer.valueJson)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

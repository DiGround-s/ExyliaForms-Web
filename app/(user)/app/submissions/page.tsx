import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FileText, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function SubmissionsPage() {
  const session = await auth()

  const submissions = await prisma.submission.findMany({
    where: { userId: session!.user.id },
    include: { form: { select: { id: true, title: true, status: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis respuestas</h1>
        <p className="text-muted-foreground">Historial de formularios que has completado.</p>
      </div>

      {submissions.length === 0 && (
        <Alert>
          <AlertDescription>No has enviado ninguna respuesta aún.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {submissions.map((sub) => (
          <Card key={sub.id}>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{sub.form.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sub.form.status === "PUBLISHED" ? "default" : "secondary"}>
                    {sub.form.status}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/app/submissions/${sub.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

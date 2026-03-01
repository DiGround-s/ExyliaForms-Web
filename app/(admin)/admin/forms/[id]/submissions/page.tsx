import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubmissionsSplitView } from "@/components/admin/submissions-split-view"

interface Params {
  params: Promise<{ id: string }>
}

export default async function AdminSubmissionsPage({ params }: Params) {
  const { id: formId } = await params

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { id: true, title: true },
  })

  if (!form) notFound()

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())

  const [submissions, total, pending, accepted, rejected, today, week] = await Promise.all([
    prisma.submission.findMany({
      where: { formId },
      include: {
        user: { select: { discordId: true, username: true, globalName: true, image: true } },
        answers: { include: { field: { select: { key: true, label: true, type: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.count({ where: { formId } }),
    prisma.submission.count({ where: { formId, status: "PENDING" } }),
    prisma.submission.count({ where: { formId, status: "ACCEPTED" } }),
    prisma.submission.count({ where: { formId, status: "REJECTED" } }),
    prisma.submission.count({ where: { formId, createdAt: { gte: startOfToday } } }),
    prisma.submission.count({ where: { formId, createdAt: { gte: startOfWeek } } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/forms/${formId}/edit`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Editar
          </Link>
        </Button>
        <h1 className="text-xl font-bold">{form.title} — Respuestas</h1>
      </div>

      <SubmissionsSplitView
        initialSubmissions={submissions.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        }))}
        stats={{ total, pending, accepted, rejected, today, week }}
      />
    </div>
  )
}

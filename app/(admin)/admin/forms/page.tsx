import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Plus, Edit2, Eye } from "lucide-react"
import { getTranslations, getLocale } from "next-intl/server"
import { LOCALE_META } from "@/i18n/locales"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DuplicateFormButton } from "@/components/admin/duplicate-form-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
}

export default async function AdminFormsPage() {
  const [session, forms, t, locale] = await Promise.all([
    auth(),
    prisma.form.findMany({
      include: {
        _count: { select: { submissions: true, fields: true } },
        createdBy: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getTranslations("admin.forms"),
    getLocale(),
  ])

  const isReviewer = session?.user.role === "REVIEWER"

  const bcp47 = LOCALE_META[locale as keyof typeof LOCALE_META]?.bcp47 ?? locale

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {!isReviewer && (
          <Button asChild>
            <Link href="/admin/forms/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        )}
      </div>

      {forms.length === 0 ? (
        <Alert>
          <AlertDescription>{t("noForms")}</AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colTitle")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
                <TableHead>{t("colFields")}</TableHead>
                <TableHead>{t("colResponses")}</TableHead>
                <TableHead>{t("colCreated")}</TableHead>
                <TableHead className="text-right">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form: typeof forms[number]) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[form.status] ?? "secondary"}>
                      {form.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{form._count.fields}</TableCell>
                  <TableCell>{form._count.submissions}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat(bcp47, { dateStyle: "short" }).format(new Date(form.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/forms/${form.id}/submissions`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {!isReviewer && <DuplicateFormButton formId={form.id} />}
                      {!isReviewer && (
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/forms/${form.id}/edit`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

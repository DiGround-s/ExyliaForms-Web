import { prisma } from "@/lib/prisma"
import { FormEditor } from "@/components/admin/form-editor"

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditFormPage({ params }: Params) {
  const { id } = await params
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <FormEditor formId={id} categories={categories} />
    </div>
  )
}

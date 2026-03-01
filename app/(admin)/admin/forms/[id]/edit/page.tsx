import { FormEditor } from "@/components/admin/form-editor"

interface Params {
  params: Promise<{ id: string }>
}

export default async function EditFormPage({ params }: Params) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <FormEditor formId={id} />
    </div>
  )
}

import { auth } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const original = await prisma.form.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
    },
  })

  if (!original) return Response.json({ error: "Not found" }, { status: 404 })

  const copy = await prisma.$transaction(async (tx) => {
    const newForm = await tx.form.create({
      data: {
        title: `Copia de ${original.title}`,
        description: original.description,
        status: "DRAFT",
        isActive: true,
        icon: original.icon,
        maxSubmissionsPerUser: original.maxSubmissionsPerUser,
        reapplyCooldownDays: original.reapplyCooldownDays,
        createdByUserId: session.user.id,
      },
    })

    const sectionIdMap = new Map<string, string>()

    if (original.sections.length > 0) {
      for (const section of original.sections) {
        const newSection = await tx.formSection.create({
          data: { formId: newForm.id, title: section.title, order: section.order },
        })
        sectionIdMap.set(section.id, newSection.id)
      }
    }

    if (original.fields.length > 0) {
      await tx.formField.createMany({
        data: original.fields.map((f) => ({
          formId: newForm.id,
          sectionId: f.sectionId ? (sectionIdMap.get(f.sectionId) ?? null) : null,
          key: f.key,
          type: f.type,
          label: f.label,
          helpText: f.helpText,
          required: f.required,
          order: f.order,
          configJson: f.configJson as object,
        })),
      })
    }

    return newForm
  })

  return Response.json({ id: copy.id }, { status: 201 })
}

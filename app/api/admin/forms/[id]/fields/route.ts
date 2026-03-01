import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { FieldType } from "@prisma/client"

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  order: z.number().int().min(0),
})

const fieldSchema = z.object({
  id: z.string().uuid().optional(),
  sectionId: z.string().nullable().optional(),
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  type: z.nativeEnum(FieldType),
  label: z.string().min(1).max(200),
  helpText: z.string().max(500).nullable().optional(),
  required: z.boolean().default(false),
  order: z.number().int().min(0),
  configJson: z.record(z.string(), z.unknown()).default({}),
})

const bodySchema = z.object({
  sections: z.array(sectionSchema).default([]),
  fields: z.array(fieldSchema),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: formId } = await params
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
  }

  const form = await prisma.form.findUnique({ where: { id: formId } })
  if (!form) return Response.json({ error: "Not found" }, { status: 404 })

  const { sections, fields } = parsed.data

  await prisma.$transaction(async (tx) => {
    await tx.formField.deleteMany({ where: { formId } })
    await tx.formSection.deleteMany({ where: { formId } })

    if (sections.length > 0) {
      await tx.formSection.createMany({
        data: sections.map((s) => ({
          id: s.id,
          formId,
          title: s.title,
          order: s.order,
        })),
      })
    }

    if (fields.length > 0) {
      await tx.formField.createMany({
        data: fields.map((f) => ({
          formId,
          sectionId: f.sectionId ?? null,
          key: f.key,
          type: f.type,
          label: f.label,
          helpText: f.helpText ?? null,
          required: f.required,
          order: f.order,
          configJson: f.configJson as object,
        })),
      })
    }
  })

  const [updatedSections, updatedFields] = await Promise.all([
    prisma.formSection.findMany({ where: { formId }, orderBy: { order: "asc" } }),
    prisma.formField.findMany({ where: { formId }, orderBy: { order: "asc" } }),
  ])

  return Response.json({ sections: updatedSections, fields: updatedFields })
}

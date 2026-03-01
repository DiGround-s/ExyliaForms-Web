import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const form = await prisma.form.update({
    where: { id },
    data: { status: "DRAFT" },
  })

  return Response.json(form)
}

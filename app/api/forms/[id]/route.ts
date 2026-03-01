import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const form = await prisma.form.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { order: "asc" } },
    },
  })

  if (!form || form.status !== "PUBLISHED") {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(form)
}

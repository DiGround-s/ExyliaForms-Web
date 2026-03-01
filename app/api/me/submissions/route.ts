import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const submissions = await prisma.submission.findMany({
    where: { userId: session.user.id },
    include: {
      form: { select: { id: true, title: true } },
      answers: { include: { field: { select: { key: true, label: true, type: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(submissions)
}

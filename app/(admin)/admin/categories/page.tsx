import { prisma } from "@/lib/prisma"
import { CategoryManager } from "@/components/admin/category-manager"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { forms: true } } },
  })

  return <CategoryManager initialCategories={categories} />
}

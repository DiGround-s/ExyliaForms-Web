-- AlterTable
ALTER TABLE "form_fields" ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "form_sections" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "form_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_sections_formId_order_idx" ON "form_sections"("formId", "order");

-- AddForeignKey
ALTER TABLE "form_sections" ADD CONSTRAINT "form_sections_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "form_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

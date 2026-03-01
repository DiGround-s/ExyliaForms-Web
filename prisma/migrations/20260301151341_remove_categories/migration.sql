/*
  Warnings:

  - You are about to drop the column `categoryId` on the `forms` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "forms" DROP CONSTRAINT "forms_categoryId_fkey";

-- AlterTable
ALTER TABLE "forms" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "categories";

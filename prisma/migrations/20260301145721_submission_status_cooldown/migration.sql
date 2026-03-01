/*
  Warnings:

  - You are about to drop the column `isRead` on the `submissions` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "reapplyCooldownDays" INTEGER;

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "isRead",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

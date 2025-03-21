/*
  Warnings:

  - Added the required column `correctAnswer` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "correctAnswer" TEXT NOT NULL,
ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[];

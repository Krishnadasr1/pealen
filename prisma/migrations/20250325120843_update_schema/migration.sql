/*
  Warnings:

  - You are about to drop the column `questionId` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Progress` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Test` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[testId]` on the table `Challenge` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[videoId]` on the table `Test` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `testId` to the `Challenge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `videoId` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Challenge" DROP CONSTRAINT "Challenge_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Progress" DROP CONSTRAINT "Progress_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_courseId_fkey";

-- DropIndex
DROP INDEX "Challenge_questionId_key";

-- DropIndex
DROP INDEX "Test_courseId_key";

-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "questionId",
ADD COLUMN     "testId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Progress" DROP COLUMN "courseId",
ADD COLUMN     "testCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "courseId",
ADD COLUMN     "videoId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_testId_key" ON "Challenge"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "Test_videoId_key" ON "Test"("videoId");

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

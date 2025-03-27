/*
  Warnings:

  - A unique constraint covering the columns `[testId]` on the table `Challenge` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Challenge_testId_key" ON "Challenge"("testId");

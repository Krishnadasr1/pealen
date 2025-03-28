/*
  Warnings:

  - You are about to drop the column `demoAudiourl` on the `Videos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Videos" DROP COLUMN "demoAudiourl",
ADD COLUMN     "animationUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "videoTranscript" TEXT NOT NULL DEFAULT '';

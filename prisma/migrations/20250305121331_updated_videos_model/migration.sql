/*
  Warnings:

  - Added the required column `audioUrl` to the `Videos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Videos" ADD COLUMN     "audioUrl" TEXT NOT NULL;

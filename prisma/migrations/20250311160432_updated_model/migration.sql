/*
  Warnings:

  - You are about to drop the column `instructorType` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "instructorType";

-- DropTable
DROP TABLE "Admin";

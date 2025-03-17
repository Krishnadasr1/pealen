-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "instructorType" TEXT NOT NULL DEFAULT '';

-- RenameForeignKey
ALTER TABLE "Course" RENAME CONSTRAINT "Course_instructorId_fkey" TO "fk_course_instructor";

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "fk_course_admin" FOREIGN KEY ("instructorId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

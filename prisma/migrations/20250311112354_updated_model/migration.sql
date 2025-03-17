-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "fk_course_admin";

-- RenameForeignKey
ALTER TABLE "Course" RENAME CONSTRAINT "fk_course_instructor" TO "Course_instructorId_fkey";

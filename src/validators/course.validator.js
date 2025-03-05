import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  thumbnail: z.string().url("Thumbnail must be a valid URL"),
  courseContent: z.array(z.string().min(1, "Course content cannot be empty")),
});

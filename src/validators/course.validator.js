import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(5, "Description must be at least 10 characters long"),
  thumbnail: z.string().url("Thumbnail must be a valid URL"),
  courseContents: z.array(z.string().min(1, "Course content cannot be empty")),
  categoryId: z.string().uuid("Invalid category ID"), // Foreign key reference
  videos: z.array(
    z.object({
      title: z.string().min(3, "Video title must be at least 3 characters long"),
      videoThumbnail: z.string().url("Thumbnail must be a valid URL"),
      videoUrl: z.string().url("Video URL must be a valid URL"),
      demoVideourl: z.string().url("Video URL must be a valid URL"),
      audioUrl: z.string().url("Audio URL must be a valid URL"),
      demoAudiourl: z.string().url("Audio URL must be a valid URL"),
    })
  ).optional(),
});

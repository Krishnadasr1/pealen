import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(5, "Description must be at least 5 characters long"),
  thumbnail: z.any().optional(),
  courseContents: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val), 
    z.array(z.string().min(1, "Course content cannot be empty"))
  ),
  categoryId: z.string().uuid("Invalid category ID"),

  videos: z.array(
    z.object({
      title: z.string().min(3, "Video title must be at least 3 characters long"),
      videoThumbnail: z.string().url("Thumbnail must be a valid URL"),
      videoUrl: z.string().url("Video URL must be a valid URL"),
      demoVideourl: z.string().url("Demo Video URL must be a valid URL"),
      videoSteps: z.array(z.string().min(1, "Video steps cannot be empty")),
      audioUrl: z.string().url("Audio URL must be a valid URL"),
      videoTranscript: z.string().min(5, "Transcript must be at least 5 characters long"),
      animationUrl: z.string().url("animationUrl URL must be a valid URL"),
      challengeDescription: z.string().min(5, "Challenge description must be at least 5 characters long").optional(),
      testQuestions: z.array(
        z.object({
          text: z.string().min(5, "Question text must be at least 5 characters long"),
          options: z.array(z.string().min(1, "Options cannot be empty")).length(4, "Exactly 4 options are required"),
          correctAnswer: z.string().min(1, "Correct answer cannot be empty"),
        }).refine((data) => data.options.includes(data.correctAnswer), {
          message: "Correct answer must be one of the provided options",
          path: ["correctAnswer"],
        })
      )
      .optional(),

    })
  ).optional(),

 
});

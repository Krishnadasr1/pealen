import { z } from "zod";

export const adminSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username cannot exceed 20 characters"),
  password: z
    .string()
    .min(5, "Password must be at least 6 characters long")
    .max(100, "Password is too long"),
});

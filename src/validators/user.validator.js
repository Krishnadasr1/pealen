import { z } from "zod";

export const userSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone:z.string().regex(/^\d{10}$/, "Invalid phone number")
});
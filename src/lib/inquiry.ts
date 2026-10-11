import { z } from "zod";

export const PREFERRED_TIMES = ["Morning", "Afternoon", "Any time"] as const;

// Shared by the browser form and /api/inquiry so both validate the same way.
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.email("Please enter a valid email address.").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\-\s]*$/, "Please use numbers only.")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more (at least 10 characters).")
    .max(2000, "Please keep your message under 2000 characters."),
  preferredTime: z.enum(PREFERRED_TIMES),
});

export type Inquiry = z.infer<typeof inquirySchema>;
export type InquiryFieldErrors = Partial<Record<keyof Inquiry, string[]>>;

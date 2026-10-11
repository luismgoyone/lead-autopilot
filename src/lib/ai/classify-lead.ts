import { generateText, Output } from "ai";
import { z } from "zod";
import type { Inquiry } from "@/lib/inquiry";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

// All AI calls go through this file. Requests route through Vercel AI Gateway,
// so switching providers is just a different AI_MODEL, e.g.
// "google/gemini-3.8-flash" → "anthropic/claude-sonnet-5.5".

export const classificationSchema = z.object({
  intent: z.enum(["booking", "pricing", "emergency", "question", "spam"]),
  urgency: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  draftReply: z.string(),
});

export type Classification = z.infer<typeof classificationSchema>;

const DEFAULT_MODEL = "google/gemini-3.8-flash";
const TIMEOUT_MS = 15_000;

export async function classifyLead(
  inquiry: Inquiry,
  receivedAt = new Date(),
): Promise<Classification> {
  const { output } = await generateText({
    model: process.env.AI_MODEL || DEFAULT_MODEL,
    instructions: SYSTEM_PROMPT,
    prompt: buildUserPrompt(inquiry, receivedAt),
    output: Output.object({ schema: classificationSchema }),
    temperature: 0.2,
    timeout: TIMEOUT_MS,
  });
  return output;
}

// Approval rule from the plan: hold anything urgent, emergency or unsure.
export function needsApproval(c: Classification) {
  return c.urgency === "high" || c.intent === "emergency" || c.confidence < 0.7;
}

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createProviderRegistry, generateText, Output } from "ai";
import { z } from "zod";
import type { Inquiry } from "@/lib/inquiry";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

// All AI calls go through this file. The model is one env var, AI_MODEL, as
// "provider/model". Switching to Claude means setting
// AI_MODEL=anthropic/<model> and ANTHROPIC_API_KEY; no code changes.
// Keys: GOOGLE_GENERATIVE_AI_API_KEY for google/*, ANTHROPIC_API_KEY for anthropic/*.
const registry = createProviderRegistry({ google, anthropic }, { separator: "/" });

export const classificationSchema = z.object({
  intent: z.enum(["booking", "pricing", "emergency", "question", "spam"]),
  urgency: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  draftReply: z.string(),
});

export type Classification = z.infer<typeof classificationSchema>;

const DEFAULT_MODEL = "google/gemini-3.5-flash-lite";
const TIMEOUT_MS = 15_000;

export async function classifyLead(
  inquiry: Inquiry,
  receivedAt = new Date(),
): Promise<Classification> {
  const { output } = await generateText({
    model: registry.languageModel(
      (process.env.AI_MODEL || DEFAULT_MODEL) as `google/${string}` | `anthropic/${string}`,
    ),
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

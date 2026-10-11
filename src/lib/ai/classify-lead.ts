import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { Inquiry } from "@/lib/inquiry";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

// All AI calls go through this file, so switching providers changes one file.

export const classificationSchema = z.object({
  intent: z.enum(["booking", "pricing", "emergency", "question", "spam"]),
  urgency: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  draftReply: z.string(),
});

export type Classification = z.infer<typeof classificationSchema>;

const responseJsonSchema = z.toJSONSchema(classificationSchema);

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const TIMEOUT_MS = 15_000;

export async function classifyLead(
  inquiry: Inquiry,
  receivedAt = new Date(),
): Promise<Classification> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildUserPrompt(inquiry, receivedAt),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema,
      temperature: 0.2,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    },
  });

  return classificationSchema.parse(JSON.parse(response.text ?? ""));
}

// Approval rule from the plan: hold anything urgent, emergency or unsure.
export function needsApproval(c: Classification) {
  return c.urgency === "high" || c.intent === "emergency" || c.confidence < 0.7;
}

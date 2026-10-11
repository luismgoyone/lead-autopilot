import { randomUUID } from "node:crypto";
import { classifyLead, needsApproval, type Classification } from "@/lib/ai/classify-lead";
import type { Inquiry } from "@/lib/inquiry";
import { STATUSES, appendInquiry, type InquiryRow, type Status } from "@/lib/sheets";

export type ProcessedInquiry = {
  row: InquiryRow;
  classification: Classification | null; // null when the AI step failed
};

function statusFor(c: Classification): Status {
  if (c.intent === "spam") return STATUSES.spam;
  if (needsApproval(c)) return STATUSES.needsApproval;
  return STATUSES.readyToSend;
}

// The pipeline behind /api/inquiry: AI tags it, then it's logged to the sheet.
// If the AI fails, the inquiry is still saved with status "AI failed".
export async function processInquiry(inquiry: Inquiry): Promise<ProcessedInquiry> {
  const receivedAt = new Date();

  let classification: Classification | null = null;
  try {
    classification = await classifyLead(inquiry, receivedAt);
  } catch (err) {
    console.error("classifyLead failed:", err);
  }

  const row: InquiryRow = {
    id: randomUUID(),
    receivedAt: receivedAt.toISOString(),
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone ?? "",
    preferredTime: inquiry.preferredTime,
    message: inquiry.message,
    intent: classification?.intent ?? "",
    urgency: classification?.urgency ?? "",
    confidence: classification ? classification.confidence.toFixed(2) : "",
    summary: classification?.summary ?? "",
    draftReply: classification?.draftReply ?? "",
    status: classification ? statusFor(classification) : STATUSES.aiFailed,
  };

  await appendInquiry(row);
  return { row, classification };
}

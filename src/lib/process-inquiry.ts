import { randomUUID } from "node:crypto";
import { classifyLead, needsApproval, type Classification } from "@/lib/ai/classify-lead";
import type { Inquiry } from "@/lib/inquiry";
import { alertOwner } from "@/lib/alerts";
import { sendReply, sendStandardAck } from "@/lib/email";
import {
  STATUSES,
  appendInquiry,
  updateInquiry,
  type InquiryRow,
  type Status,
} from "@/lib/sheets";

export type ProcessedInquiry = {
  row: InquiryRow;
  classification: Classification | null; // null when the AI step failed
};

function statusFor(c: Classification): Status {
  if (c.intent === "spam") return STATUSES.spam;
  if (needsApproval(c)) return STATUSES.needsApproval;
  return STATUSES.readyToSend;
}

// The pipeline behind /api/inquiry:
// 1. AI tags it  2. saved to the sheet  3. routine → reply emailed now,
// held/spam → nothing sent  4. owner alerted in Discord.
// If the AI fails, the inquiry is still saved ("AI failed") and the patient
// gets a standard "we got your message" email. Email and alert failures are
// logged but never lose the inquiry.
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

  const rowNumber = await appendInquiry(row);

  try {
    if (row.status === STATUSES.readyToSend) {
      await sendReply(row.email, row.draftReply);
      row.status = STATUSES.sent;
      await updateInquiry(rowNumber, { status: row.status });
    } else if (row.status === STATUSES.aiFailed) {
      await sendStandardAck(row.email, row.name);
    }
  } catch (err) {
    console.error("Sending reply failed:", err);
  }

  try {
    await alertOwner(row);
  } catch (err) {
    console.error("Owner alert failed:", err);
  }

  return { row, classification };
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, checkPassword, requireAdmin, sessionToken } from "@/lib/auth";
import { sendReply } from "@/lib/email";
import { STATUSES, listInquiries, updateInquiry } from "@/lib/sheets";

export async function login(_prev: string | null, formData: FormData) {
  const attempt = String(formData.get("password") ?? "");
  if (!checkPassword(attempt)) return "That password didn't work.";

  (await cookies()).set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/dashboard/login");
}

export async function approveAndSend(_prev: string | null, formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const reply = String(formData.get("reply") ?? "").trim();
  if (reply.length < 10) return "The reply looks too short to send.";

  const row = (await listInquiries()).find((r) => r.id === id);
  if (!row) return "We couldn't find that inquiry. It may have been removed from the sheet.";
  if (row.status !== STATUSES.needsApproval) return "This inquiry was already handled.";

  try {
    await sendReply(row.email, reply);
  } catch (err) {
    console.error("approveAndSend: email failed", err);
    return "The email didn't go through. Please try again.";
  }
  await updateInquiry(row.rowNumber, { draftReply: reply, status: STATUSES.sent });
  redirect("/dashboard?sent=1");
}

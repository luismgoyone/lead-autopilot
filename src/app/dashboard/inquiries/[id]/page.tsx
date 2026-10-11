import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IntentTag, StatusTag, UrgencyTag } from "@/components/tags";
import { requireAdmin } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { STATUSES, listInquiries } from "@/lib/sheets";
import { DashboardShell } from "../../shell";
import { ApproveForm } from "./approve-form";

export const metadata: Metadata = { title: "Review inquiry · Lead Autopilot" };

export default function InquiryPage({ params }: PageProps<"/dashboard/inquiries/[id]">) {
  return (
    <DashboardShell>
      <Link href="/dashboard" className="text-sm font-medium text-pine hover:underline">
        ← Back to inbox
      </Link>
      <Suspense fallback={<p className="mt-6 text-slate/60">Loading inquiry…</p>}>
        <InquiryDetail params={params} />
      </Suspense>
    </DashboardShell>
  );
}

async function InquiryDetail({ params }: { params: PageProps<"/dashboard/inquiries/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const row = (await listInquiries()).find((r) => r.id === id);
  if (!row) notFound();

  const held = row.status === STATUSES.needsApproval;
  const confidence = Number(row.confidence);
  const reasons = [
    row.intent === "emergency" && "the intent is Emergency",
    row.urgency === "high" && "urgency is High",
    row.confidence && confidence < 0.7 && `the AI is only ${Math.round(confidence * 100)}% sure`,
  ].filter(Boolean);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_-8px_rgba(31,42,48,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-medium">{row.name}</h1>
            <p className="mt-1 text-sm text-slate/70">Received {formatWhen(row.receivedAt)}</p>
          </div>
          <StatusTag status={row.status} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <Detail label="Email">{row.email}</Detail>
          <Detail label="Phone">{row.phone || "—"}</Detail>
          <Detail label="Preferred time">{row.preferredTime}</Detail>
        </dl>

        <h2 className="mt-6 text-xs font-semibold tracking-wide text-slate/60 uppercase">Message</h2>
        <blockquote className="mt-2 rounded-xl bg-mist p-4 whitespace-pre-wrap">{row.message}</blockquote>

        <h2 className="mt-6 text-xs font-semibold tracking-wide text-slate/60 uppercase">AI analysis</h2>
        {row.intent ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <IntentTag intent={row.intent} />
              <UrgencyTag urgency={row.urgency} />
              <span className="text-sm text-slate/70">{Math.round(confidence * 100)}% confident</span>
            </div>
            <p className="mt-3">{row.summary}</p>
          </>
        ) : (
          <p className="mt-2 text-slate/70">
            The AI step failed for this inquiry, so the patient got the standard &quot;we got your message&quot; email.
          </p>
        )}

        {held && reasons.length > 0 && (
          <p className="mt-6 rounded-xl bg-sunrise/10 px-4 py-3 text-sm">
            Held for your approval because {reasons.join(" and ")}.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_-8px_rgba(31,42,48,0.08)]">
        {held ? (
          <ApproveForm id={row.id} email={row.email} draft={row.draftReply} />
        ) : (
          <>
            <h2 className="font-display text-2xl font-medium">
              {row.status === STATUSES.sent ? "Reply sent" : "No reply sent"}
            </h2>
            {row.draftReply ? (
              <p className="mt-4 rounded-xl bg-mist p-4 whitespace-pre-wrap">{row.draftReply}</p>
            ) : (
              <p className="mt-4 text-slate/70">
                {row.status === STATUSES.spam ? "Marked as spam, so nothing was sent." : "There's no drafted reply for this inquiry."}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-slate/60 uppercase">{label}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  );
}

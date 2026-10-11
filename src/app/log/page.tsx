import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { IntentTag, StatusTag, UrgencyTag } from "@/components/tags";
import { formatWhen } from "@/lib/format";
import { STATUSES, listInquiries } from "@/lib/sheets";

export const metadata: Metadata = {
  title: "Live inquiry log · Pinecrest Dental",
  description: "A read-only view of how Lead Autopilot handles each inquiry. All data is made up.",
};

const FLOW = ["Inquiry form", "AI tags it", "Saved to Google Sheet", "Reply sent or held", "Owner alerted"];

export default function LogPage() {
  return (
    <>
      <header className="border-b border-pine/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Pinecrest Dental home"><Logo /></Link>
          <Link
            href="/#inquiry"
            className="rounded-lg bg-sunrise px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d06a4d]"
          >
            Send a test inquiry
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <p className="inline-block rounded-full bg-sage px-3 py-1 text-xs font-semibold text-pine">
          Lead Autopilot demo
        </p>
        <h1 className="mt-4 font-display text-4xl font-medium sm:text-5xl">Every inquiry, answered in under a minute.</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate/80">
          This is Pinecrest Dental&apos;s inquiry log, read live from Google Sheets. Names are shortened and contact
          details are hidden. Pinecrest is a demo clinic and all data is made up.
        </p>

        <ol className="mt-8 grid gap-2 sm:grid-cols-5">
          {FLOW.map((step, i) => (
            <li key={step} className="rounded-xl bg-white p-4 text-sm">
              <p className="text-xs font-semibold text-pine">Step {i + 1}</p>
              <p className="mt-1 font-medium">{step}</p>
            </li>
          ))}
        </ol>

        <Suspense fallback={<p className="mt-10 text-slate/60">Loading the log…</p>}>
          <PublicLog />
        </Suspense>
      </main>

      <footer className="bg-pine text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-white/75 sm:px-6">
          Pinecrest Dental is a demo business. Built with Lead Autopilot.
        </div>
      </footer>
    </>
  );
}

async function PublicLog() {
  await connection(); // read the sheet at request time, not during the build
  const rows = await getPublicRows();
  const held = rows.filter((r) => r.status === STATUSES.needsApproval).length;
  const auto = rows.filter((r) => r.status === STATUSES.sent).length;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-white px-3 py-1">{rows.length} inquiries</span>
        <span className="rounded-full bg-white px-3 py-1">{auto} replied</span>
        <span className="rounded-full bg-white px-3 py-1">{held} held for approval</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-[0_10px_30px_-8px_rgba(31,42,48,0.08)]">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-slate/60">No inquiries yet. Send the first one.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-pine/10 text-xs tracking-wide text-slate/60 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Summary</th>
                <th className="px-4 py-3 font-semibold">Intent</th>
                <th className="px-4 py-3 font-semibold">Urgency</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine/10">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-slate/70">{formatWhen(row.receivedAt)}</td>
                  <td className="px-4 py-3 font-semibold">{row.initials}</td>
                  <td className="max-w-sm px-4 py-3"><p className="truncate">{row.summary}</p></td>
                  <td className="px-4 py-3"><IntentTag intent={row.intent} /></td>
                  <td className="px-4 py-3"><UrgencyTag urgency={row.urgency} /></td>
                  <td className="px-4 py-3"><StatusTag status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-xs text-slate/60">Read-only. Refreshes about once a minute.</p>
    </section>
  );
}

// Only the fields that are safe to show publicly; never email, phone or the full message.
async function getPublicRows() {
  "use cache";
  cacheLife("minutes");
  const rows = await listInquiries();
  return rows.slice(0, 50).map((r) => ({
    id: r.id,
    receivedAt: r.receivedAt,
    initials: r.name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => `${part[0].toUpperCase()}.`)
      .join(" "),
    summary: r.summary || (r.status === STATUSES.aiFailed ? "(AI step failed)" : ""),
    intent: r.intent,
    urgency: r.urgency,
    status: r.status,
  }));
}

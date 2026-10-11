import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IntentTag, StatusTag, UrgencyTag } from "@/components/tags";
import { requireAdmin } from "@/lib/auth";
import { formatWhen, isWithinDays } from "@/lib/format";
import { STATUSES, listInquiries } from "@/lib/sheets";
import { DashboardShell } from "./shell";

export const metadata: Metadata = { title: "Inbox · Lead Autopilot" };

const MINUTES_PER_INQUIRY = 5;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "approval", label: "Needs approval", status: STATUSES.needsApproval },
  { key: "sent", label: "Sent", status: STATUSES.sent },
  { key: "spam", label: "Spam", status: STATUSES.spam },
  { key: "failed", label: "AI failed", status: STATUSES.aiFailed },
] as const;

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <DashboardShell>
      <Suspense fallback={<p className="text-slate/60">Loading inquiries…</p>}>
        <Inbox searchParams={searchParams} />
      </Suspense>
    </DashboardShell>
  );
}

async function Inbox({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  await requireAdmin();
  const params = await searchParams;
  const filterKey = typeof params.filter === "string" ? params.filter : "all";
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];

  const rows = await listInquiries();
  const waiting = rows.filter((r) => r.status === STATUSES.needsApproval).length;
  const handled = rows.length - waiting;
  const thisWeek = rows.filter((r) => isWithinDays(r.receivedAt, 7)).length;
  const shown = "status" in filter ? rows.filter((r) => r.status === filter.status) : rows;

  return (
    <>
      {params.sent === "1" && (
        <p role="status" className="mb-6 rounded-xl bg-sage px-4 py-3 text-pine">
          Reply sent.
        </p>
      )}

      <h1 className="font-display text-3xl font-medium">Inbox</h1>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Inquiries this week" value={thisWeek} />
        <Stat label="Total inquiries" value={rows.length} />
        <Stat label="Waiting for approval" value={waiting} highlight={waiting > 0} />
        <Stat
          label="Minutes saved"
          value={handled * MINUTES_PER_INQUIRY}
          note={`${handled} handled × ${MINUTES_PER_INQUIRY} min`}
        />
      </section>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Filter inquiries">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/dashboard" : `/dashboard?filter=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              f.key === filter.key ? "bg-pine text-white" : "bg-white text-slate hover:bg-sage"
            }`}
          >
            {f.label}
            {f.key === "approval" && waiting > 0 && ` (${waiting})`}
          </Link>
        ))}
      </nav>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-[0_10px_30px_-8px_rgba(31,42,48,0.08)]">
        {shown.length === 0 ? (
          <p className="px-6 py-12 text-center text-slate/60">No inquiries here yet.</p>
        ) : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-pine/10 text-xs tracking-wide text-slate/60 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Summary</th>
                <th className="px-4 py-3 font-semibold">Intent</th>
                <th className="px-4 py-3 font-semibold">Urgency</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine/10">
              {shown.map((row) => (
                <tr key={row.id} className={row.status === STATUSES.needsApproval ? "bg-sunrise/5" : undefined}>
                  <td className="px-4 py-3 whitespace-nowrap text-slate/70">{formatWhen(row.receivedAt)}</td>
                  <td className="px-4 py-3 font-semibold">{row.name}</td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate">{row.summary || row.message}</p>
                  </td>
                  <td className="px-4 py-3"><IntentTag intent={row.intent} /></td>
                  <td className="px-4 py-3"><UrgencyTag urgency={row.urgency} /></td>
                  <td className="px-4 py-3"><StatusTag status={row.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/inquiries/${row.id}`}
                      className={
                        row.status === STATUSES.needsApproval
                          ? "rounded-lg bg-sunrise px-3 py-1.5 font-semibold text-white hover:bg-[#d06a4d]"
                          : "font-medium text-pine hover:underline"
                      }
                    >
                      {row.status === STATUSES.needsApproval ? "Review" : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Stat({ label, value, note, highlight }: { label: string; value: number; note?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white p-5 ${highlight ? "ring-2 ring-sunrise/50" : ""}`}>
      <p className="text-sm text-slate/70">{label}</p>
      <p className={`mt-2 font-display text-4xl ${highlight ? "text-[#b4532f]" : "text-slate"}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-slate/60">{note}</p>}
    </div>
  );
}

import Link from "next/link";
import type { Classification } from "@/lib/ai/classify-lead";
import { IntentTag, StatusTag, UrgencyTag } from "@/components/tags";

export type InquiryResultData = {
  message: string;
  status?: string;
  classification?: Classification | null;
  timings?: { classified: number; saved: number; replied: number; alerted: number };
};

const STATUS_NOTES: Record<string, string> = {
  Sent: "This was routine, so the reply above was emailed right away.",
  "Needs approval":
    "Held for Dr. Reyes to review before anything is sent. Emergencies, high urgency, or anything the AI is less than 70% sure about always wait for a person.",
  "Spam (no reply)": "Tagged as spam, so no reply was sent.",
  "AI failed":
    "The AI step didn't finish, so the message was still saved and a standard \"we got your message\" email went out. No inquiry is lost.",
  "Ready to send": "This was routine. The reply couldn't be sent just now, so the team was alerted to send it.",
};

// Shown to visitors after they submit: the patient-facing confirmation plus a
// "behind the scenes" look at what Lead Autopilot did with the message.
export function InquiryResult({ data, onReset }: { data: InquiryResultData; onReset: () => void }) {
  const c = data.classification;
  const t = data.timings;
  const held = data.status === "Needs approval";

  const steps = t
    ? [
        { label: "Form received", time: 0 },
        { label: c ? "AI tagged it" : "AI step failed", time: t.classified },
        { label: "Saved to Google Sheet", time: t.saved },
        {
          label: held ? "Waiting for approval" : data.status === "Sent" || data.status === "AI failed" ? "Reply emailed" : "No reply needed",
          time: held ? null : t.replied,
        },
        { label: "Owner alerted in Discord", time: t.alerted },
      ]
    : [];

  return (
    <div role="status">
      <div className="text-center">
        <p className="font-display text-3xl text-pine">Message received.</p>
        <p className="mx-auto mt-3 max-w-md text-slate/80">{data.message}</p>
      </div>

      {data.status && (
        <section className="mt-8 rounded-2xl bg-mist p-5 sm:p-6">
          <p className="text-xs font-semibold tracking-wider text-pine uppercase">Demo: behind the scenes</p>
          <h3 className="mt-1 font-display text-2xl">What Lead Autopilot did</h3>

          {c && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <IntentTag intent={c.intent} />
                <UrgencyTag urgency={c.urgency} />
                <span className="text-sm text-slate/70">{Math.round(c.confidence * 100)}% confident</span>
              </div>
              <p className="mt-3"><span className="font-semibold">Summary:</span> {c.summary}</p>
              {c.draftReply && (
                <div className="mt-4">
                  <p className="text-sm font-semibold">{held ? "Drafted reply (not sent yet)" : "Reply"}</p>
                  <p className="mt-2 rounded-xl bg-white p-4 whitespace-pre-wrap">{c.draftReply}</p>
                </div>
              )}
            </>
          )}

          <div className="mt-4 flex flex-wrap items-start gap-3">
            <StatusTag status={data.status} />
            <p className="flex-1 text-sm text-slate/80">{STATUS_NOTES[data.status]}</p>
          </div>

          {steps.length > 0 && (
            <ol className="mt-6 grid gap-2 sm:grid-cols-5">
              {steps.map((step) => (
                <li key={step.label} className="rounded-xl bg-white p-3 text-sm">
                  <p className="font-semibold">{step.label}</p>
                  <p className="text-slate/60">{step.time === null ? "pending" : `${step.time.toFixed(1)}s`}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-pine/30 px-5 py-2.5 font-medium text-pine hover:bg-sage/50"
        >
          Send another inquiry
        </button>
        <Link href="/log" className="rounded-lg bg-pine px-5 py-2.5 font-medium text-white hover:bg-[#264d42]">
          View the inquiry log
        </Link>
      </div>
    </div>
  );
}

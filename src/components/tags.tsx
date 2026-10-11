// Small coloured chips for intent, urgency and status. Shared by the owner
// dashboard and the public inquiry log.

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

const tones = {
  sage: "bg-sage text-pine",
  sunrise: "bg-sunrise/15 text-[#b4532f]",
  amber: "bg-[#f6e7c8] text-[#7a5410]",
  gray: "bg-slate/10 text-slate/70",
  pine: "bg-pine text-white",
} as const;

export function Chip({ tone, children }: { tone: keyof typeof tones; children: React.ReactNode }) {
  return <span className={`${base} ${tones[tone]}`}>{children}</span>;
}

export function IntentTag({ intent }: { intent: string }) {
  if (!intent) return <span className="text-slate/40">—</span>;
  const tone = intent === "emergency" ? "sunrise" : intent === "spam" ? "gray" : "sage";
  return <Chip tone={tone}>{intent[0].toUpperCase() + intent.slice(1)}</Chip>;
}

export function UrgencyTag({ urgency }: { urgency: string }) {
  if (!urgency) return <span className="text-slate/40">—</span>;
  const tone = urgency === "high" ? "sunrise" : urgency === "medium" ? "amber" : "sage";
  return <Chip tone={tone}>{urgency[0].toUpperCase() + urgency.slice(1)}</Chip>;
}

export function StatusTag({ status }: { status: string }) {
  const tone =
    status === "Needs approval"
      ? "sunrise"
      : status === "Sent"
        ? "pine"
        : status === "AI failed"
          ? "amber"
          : "gray";
  return <Chip tone={tone}>{status}</Chip>;
}

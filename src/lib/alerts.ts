import type { InquiryRow } from "@/lib/sheets";
import { STATUSES } from "@/lib/sheets";

// Owner alerts via a Discord webhook.

const COLORS: Record<string, number> = {
  [STATUSES.needsApproval]: 0xe0795b, // Sunrise
  [STATUSES.aiFailed]: 0xb4532f,
  [STATUSES.spam]: 0x9aa5a0,
};
const PINE = 0x2f5d50;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export async function alertOwner(row: InquiryRow) {
  const url = process.env.OWNER_ALERT_WEBHOOK_URL;
  if (!url) throw new Error("OWNER_ALERT_WEBHOOK_URL is not set");

  const held = row.status === STATUSES.needsApproval;
  const title = held
    ? `⏳ Needs your approval: ${row.name}`
    : row.status === STATUSES.aiFailed
      ? `⚠️ AI failed, standard reply sent: ${row.name}`
      : row.status === STATUSES.spam
        ? `🚫 Spam filtered: ${row.name}`
        : `✅ Replied automatically: ${row.name}`;

  const fields = [
    row.intent && { name: "Intent", value: row.intent, inline: true },
    row.urgency && { name: "Urgency", value: row.urgency, inline: true },
    row.confidence && { name: "Confidence", value: row.confidence, inline: true },
    row.summary && { name: "Summary", value: clip(row.summary, 1024) },
    { name: "Message", value: clip(row.message, 1024) },
    row.draftReply && { name: held ? "Draft reply (not sent)" : "Reply sent", value: clip(row.draftReply, 1024) },
    { name: "Contact", value: [row.email, row.phone].filter(Boolean).join(" · "), inline: true },
    { name: "Preferred time", value: row.preferredTime, inline: true },
  ].filter(Boolean);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Lead Autopilot",
      embeds: [
        {
          title: clip(title, 256),
          color: COLORS[row.status] ?? PINE,
          fields,
          footer: { text: `Pinecrest Dental · ${row.status}` },
          timestamp: row.receivedAt,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Discord ${res.status}: ${await res.text()}`);
}

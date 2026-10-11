// Patient reply emails via Resend.

const FROM = process.env.EMAIL_FROM || "Pinecrest Dental <onboarding@resend.dev>";

// Demo mode: send every patient email to this address instead of the patient's.
// Needed until a domain is verified in Resend (it only delivers to your own address).
const TEST_RECIPIENT = process.env.EMAIL_TEST_RECIPIENT;

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [TEST_RECIPIENT || to],
      subject,
      text: TEST_RECIPIENT ? `[Demo: originally to ${to}]\n\n${text}` : text,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export function sendReply(to: string, text: string) {
  return sendEmail({ to, subject: "Re: your message to Pinecrest Dental", text });
}

// Used when the AI step fails, so the patient still hears back right away.
export function sendStandardAck(to: string, name: string) {
  const firstName = name.split(" ")[0];
  return sendEmail({
    to,
    subject: "We got your message - Pinecrest Dental",
    text: `Hi ${firstName},

Thanks for reaching out to Pinecrest Dental. We got your message and someone from our team will get back to you soon, usually within clinic hours (Monday to Saturday, 9 AM to 6 PM).

If it's urgent, please call us at (074) 555-0142.

Pinecrest Dental`,
  });
}

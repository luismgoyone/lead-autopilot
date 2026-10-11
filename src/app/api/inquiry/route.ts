import { z } from "zod";
import { inquirySchema } from "@/lib/inquiry";
import { processInquiry } from "@/lib/process-inquiry";
import { clientIp, rateLimit, verifyTurnstile } from "@/lib/spam";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const extras = (body ?? {}) as { website?: unknown; turnstileToken?: unknown };

  // Honeypot filled in: it's a bot. Pretend it worked and do nothing.
  if (typeof extras.website === "string" && extras.website.trim()) {
    return Response.json({ ok: true, message: "Thanks, we got your message." });
  }

  const ip = clientIp(request);
  const limit = rateLimit(ip ?? "unknown");
  if (!limit.ok) {
    return Response.json(
      { ok: false, error: "You've sent a few messages already. Please try again later or call (074) 555-0142." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const token = typeof extras.turnstileToken === "string" ? extras.turnstileToken : undefined;
  if (!(await verifyTurnstile(token, ip))) {
    return Response.json(
      { ok: false, error: "Please complete the \"verify you are human\" check and try again." },
      { status: 400 },
    );
  }

  const result = inquirySchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      {
        ok: false,
        error: "Please check the highlighted fields.",
        fieldErrors: z.flattenError(result.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const inquiry = result.data;
  const firstName = inquiry.name.split(" ")[0];

  try {
    const { row, classification, timings } = await processInquiry(inquiry);
    return Response.json({
      ok: true,
      message: `Thanks, ${firstName}. We got your message and will reply to ${inquiry.email} shortly.`,
      id: row.id,
      status: row.status,
      classification,
      timings,
    });
  } catch (err) {
    console.error("processInquiry failed:", err);
    return Response.json(
      {
        ok: false,
        error: "Sorry, we couldn't save your message. Please try again or call (074) 555-0142.",
      },
      { status: 500 },
    );
  }
}

import { z } from "zod";
import { inquirySchema } from "@/lib/inquiry";
import { processInquiry } from "@/lib/process-inquiry";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
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
    const { row, classification } = await processInquiry(inquiry);
    return Response.json({
      ok: true,
      message: `Thanks, ${firstName}. We got your message and will reply to ${inquiry.email} shortly.`,
      id: row.id,
      status: row.status,
      classification,
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

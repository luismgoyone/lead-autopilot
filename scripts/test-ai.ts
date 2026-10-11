// Runs the 20 sample inquiries through classifyLead() and prints a scorecard.
// Usage: npm run test:ai   (reads GEMINI_API_KEY from .env.local)
import { classifyLead, needsApproval } from "@/lib/ai/classify-lead";
import { samples } from "./samples";

// Spam is never "held"; it just gets no reply.
const isHeld = (c: Parameters<typeof needsApproval>[0]) =>
  c.intent !== "spam" && needsApproval(c);

// Rough check: a Tagalog reply usually contains one of these words.
const TAGALOG = /\b(po|opo|salamat|kayo|namin|natin|bukas|ngayon|pwede|puwede)\b/i;

async function main() {
  let passed = 0;
  for (const [i, sample] of samples.entries()) {
    const label = `${String(i + 1).padStart(2)}. ${sample.message.slice(0, 50)}`;
    try {
      const c = await classifyLead({
        name: sample.name,
        email: "test@example.com",
        message: sample.message,
        preferredTime: "Any time",
      });
      const problems: string[] = [];
      if (c.intent !== sample.expect.intent) problems.push(`intent ${c.intent} ≠ ${sample.expect.intent}`);
      if (sample.expect.urgency && c.urgency !== sample.expect.urgency)
        problems.push(`urgency ${c.urgency} ≠ ${sample.expect.urgency}`);
      if (isHeld(c) !== sample.expect.held) problems.push(`held ${isHeld(c)} ≠ ${sample.expect.held}`);
      if (sample.expect.intent === "spam" && c.draftReply.trim()) problems.push("spam got a reply");
      if (sample.expect.language === "tagalog" && !TAGALOG.test(c.draftReply)) problems.push("reply not in Tagalog");

      if (problems.length === 0) passed++;
      console.log(`${problems.length ? "✗" : "✓"} ${label}`);
      console.log(`     ${c.intent}/${c.urgency} ${c.confidence.toFixed(2)} · ${c.summary}`);
      if (c.draftReply) console.log(`     → ${c.draftReply.replace(/\s+/g, " ")}`);
      for (const p of problems) console.log(`     ! ${p}`);
    } catch (err) {
      console.log(`✗ ${label}\n     ! error: ${(err as Error).message}`);
    }
  }
  console.log(`\n${passed}/${samples.length} passed`);
}

main();

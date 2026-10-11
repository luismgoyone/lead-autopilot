// Checks the Google Sheets connection by appending one demo row and reading it back.
// Usage: npm run test:sheets
import { randomUUID } from "node:crypto";
import { STATUSES, appendInquiry, listInquiries } from "@/lib/sheets";

async function main() {
  const id = `test-${randomUUID().slice(0, 8)}`;
  await appendInquiry({
    id,
    receivedAt: new Date().toISOString(),
    name: "Test Patient",
    email: "test@example.com",
    phone: "",
    preferredTime: "Any time",
    message: "Connection test from scripts/test-sheets.ts",
    intent: "question",
    urgency: "low",
    confidence: "1.00",
    summary: "Sheets connection test",
    draftReply: "",
    status: STATUSES.readyToSend,
  });
  const rows = await listInquiries();
  const found = rows.find((r) => r.id === id);
  if (!found) throw new Error("Row was appended but not found when reading back");
  console.log(`✓ Wrote and read back row ${found.rowNumber} (${id}). ${rows.length} rows in the log.`);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});

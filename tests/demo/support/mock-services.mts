// Local stand-in for every outside service the app talks to, used only by the
// demo recording (`npm run demo:record`). The app server is started with
// tests/demo/support/redirect-external.mjs preloaded, which sends each external
// request here as /__ext/<original host>/<path>.
//
//   oauth2.googleapis.com             → a fake access token
//   sheets.googleapis.com             → an in-memory sheet, seeded with made-up inquiries
//   generativelanguage.googleapis.com → a canned, keyword-based classification
//   api.resend.com                    → accepted, nothing sent
//   alerts.invalid (Discord webhook)  → accepted, nothing posted
//   challenges.cloudflare.com         → Turnstile check always passes
//
// GET /__calls lists what was intercepted; POST /__reset reseeds the sheet.

import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const PORT = Number(process.env.DEMO_MOCK_PORT ?? 4319);

const HEADERS = [
  "ID", "Date", "Name", "Email", "Phone", "Preferred time", "Message",
  "Intent", "Urgency", "Confidence", "Summary", "Draft reply", "Status",
];

type Seed = {
  hoursAgo: number;
  name: string;
  phone?: string;
  preferredTime: string;
  message: string;
  intent: string;
  urgency: string;
  confidence: number;
  summary: string;
  draftReply: string;
  status: string;
};

// Oldest first, like the real sheet. All names and details are made up.
const SEED: Seed[] = [
  {
    hoursAgo: 70, name: "Jose Ramirez", preferredTime: "Morning",
    message: "Hi, how much is a cleaning? It's been a while since my last one.",
    intent: "pricing", urgency: "low", confidence: 0.92,
    summary: "Asks about the price of a cleaning.",
    draftReply: "Hi Jose, thanks for reaching out. Cleaning prices depend on what you need, so we'll confirm the cost at your visit. Would a morning this week work for you?\n\nPinecrest Dental",
    status: "Sent",
  },
  {
    hoursAgo: 52, name: "Win Big Promos", preferredTime: "Any time",
    message: "Get 10,000 followers today!!! Click here for our SEO package.",
    intent: "spam", urgency: "low", confidence: 0.98,
    summary: "Marketing spam.", draftReply: "", status: "Spam (no reply)",
  },
  {
    hoursAgo: 30, name: "Liza Mendoza", phone: "0917 555 0181", preferredTime: "Afternoon",
    message: "Can I book a check-up for my 6-year-old? Saturdays are best for us.",
    intent: "booking", urgency: "low", confidence: 0.95,
    summary: "Wants a Saturday check-up for her 6-year-old.",
    draftReply: "Hi Liza, we'd be happy to see your little one. We're open Saturdays 9 AM to 6 PM. Which time works best for you?\n\nPinecrest Dental",
    status: "Sent",
  },
  {
    hoursAgo: 22, name: "Paolo Garcia", preferredTime: "Any time",
    message: "Do you do Invisalign? Magkano po?",
    intent: "pricing", urgency: "low", confidence: 0.9,
    summary: "Asks if the clinic offers Invisalign and the cost.",
    draftReply: "Hi Paolo, salamat sa message! We'll go over clear aligner options and the cost at a short consultation. Kailan po kayo available?\n\nPinecrest Dental",
    status: "Sent",
  },
  {
    hoursAgo: 9, name: "Grace Villanueva", preferredTime: "Morning",
    message: "My filling feels weird since last week. Not sure if it's a problem.",
    intent: "question", urgency: "medium", confidence: 0.64,
    summary: "A filling has felt off for a week; unsure if it needs attention.",
    draftReply: "Hi Grace, thanks for letting us know. It's worth having the filling checked. Could you come in this week so the dentist can take a look?\n\nPinecrest Dental",
    status: "Needs approval",
  },
  {
    hoursAgo: 5, name: "Mark Dela Cruz", phone: "0928 555 0110", preferredTime: "Afternoon",
    message: "Need to move my Thursday cleaning to next week please.",
    intent: "booking", urgency: "low", confidence: 0.96,
    summary: "Wants to reschedule Thursday's cleaning to next week.",
    draftReply: "Hi Mark, no problem. Which afternoon next week works for you? We'll move your cleaning.\n\nPinecrest Dental",
    status: "Sent",
  },
  {
    hoursAgo: 2, name: "Rhea Bautista", preferredTime: "Any time",
    message: "Do you accept Maxicare? Planning to bring the whole family.",
    intent: "question", urgency: "low", confidence: 0.88,
    summary: "Asks whether the clinic accepts Maxicare for her family.",
    draftReply: "Hi Rhea, thanks for thinking of us for your family. Please send your card details and we'll check your coverage before your visit.\n\nPinecrest Dental",
    status: "Sent",
  },
];

let rows: string[][] = [];

function reset() {
  rows = SEED.map((s) => [
    randomUUID(),
    new Date(Date.now() - s.hoursAgo * 3_600_000).toISOString(),
    s.name,
    `${s.name.split(" ")[0].toLowerCase()}@example.com`,
    s.phone ?? "",
    s.preferredTime,
    s.message,
    s.intent,
    s.urgency,
    s.confidence.toFixed(2),
    s.summary,
    s.draftReply,
    s.status,
  ]);
  calls.length = 0;
}

const calls: { host: string; method: string; path: string }[] = [];

// The fake "AI": tags the message by keywords and drafts a short reply.
function classify(prompt: string) {
  const name = prompt.match(/^Name: (.+)$/m)?.[1]?.trim() ?? "there";
  const message = prompt.match(/"""\n([\s\S]*?)\n"""/)?.[1] ?? prompt;
  const first = name.split(" ")[0];

  if (/tooth|hurt|pain|swell|bleed|broke|chipped/i.test(message)) {
    return {
      intent: "emergency", urgency: "high", confidence: 0.94,
      summary: "Chipped a tooth and is in pain; wants to be seen today.",
      draftReply: `Hi ${first}, sorry to hear that. We keep slots open for urgent cases. Can you come in at 10 AM today? If the pain gets worse, call us at (074) 555-0142.\n\nPinecrest Dental`,
    };
  }
  if (/price|cost|how much|magkano/i.test(message)) {
    return {
      intent: "pricing", urgency: "low", confidence: 0.9,
      summary: "Asks about prices.",
      draftReply: `Hi ${first}, thanks for asking. We'll confirm the exact cost at your visit. When would you like to come in?\n\nPinecrest Dental`,
    };
  }
  if (/book|appointment|clean|check-?up|schedule/i.test(message)) {
    return {
      intent: "booking", urgency: "low", confidence: 0.95,
      summary: "Wants to book a visit.",
      draftReply: `Hi ${first}, we'd be glad to see you. Which day works best for you?\n\nPinecrest Dental`,
    };
  }
  return {
    intent: "question", urgency: "medium", confidence: 0.62,
    summary: "General question.",
    draftReply: `Hi ${first}, thanks for your message. We'll get back to you shortly.\n\nPinecrest Dental`,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

// "'Inquiries'!M5" → { col: 12, row: 5 }
function cell(range: string) {
  const [, letters, row] = range.match(/!([A-Z]+)(\d+)/) ?? [];
  return { col: letters.charCodeAt(0) - 65, row: Number(row) };
}

async function sheets(req: IncomingMessage, res: ServerResponse, path: string) {
  // path: /v4/spreadsheets/<id><rest>
  const rest = decodeURIComponent(path.replace(/^\/v4\/spreadsheets\/[^/?:]+/, ""));
  if (req.method === "GET" && rest.startsWith("?fields")) {
    return json(res, 200, { sheets: [{ properties: { title: "Inquiries" } }] });
  }
  if (req.method === "GET" && rest.includes("A1:M1")) return json(res, 200, { values: [HEADERS] });
  if (req.method === "PUT") return json(res, 200, {});
  if (req.method === "POST" && rest.includes(":append")) {
    const { values } = JSON.parse(await readBody(req)) as { values: string[][] };
    rows.push(values[0]);
    const n = rows.length + 1;
    return json(res, 200, { updates: { updatedRange: `'Inquiries'!A${n}:M${n}` } });
  }
  if (req.method === "GET" && rest.includes("A2:M")) return json(res, 200, { values: rows });
  if (req.method === "POST" && rest.startsWith("/values:batchUpdate")) {
    const { data } = JSON.parse(await readBody(req)) as { data: { range: string; values: string[][] }[] };
    for (const write of data) {
      const { col, row } = cell(write.range);
      const target = rows[row - 2];
      if (target) target[col] = write.values[0][0];
    }
    return json(res, 200, {});
  }
  return json(res, 404, { error: `mock sheets: unhandled ${req.method} ${rest}` });
}

async function external(req: IncomingMessage, res: ServerResponse, host: string, path: string) {
  calls.push({ host, method: req.method ?? "GET", path });

  switch (host) {
    case "oauth2.googleapis.com":
      await readBody(req);
      return json(res, 200, { access_token: "demo-token", expires_in: 3600, token_type: "Bearer" });

    case "sheets.googleapis.com":
      return sheets(req, res, path);

    case "generativelanguage.googleapis.com": {
      const body = JSON.parse(await readBody(req)) as {
        contents: { parts: { text?: string }[] }[];
      };
      const prompt = body.contents.flatMap((c) => c.parts.map((p) => p.text ?? "")).join("\n");
      await sleep(700); // feels like a real model call
      return json(res, 200, {
        candidates: [
          {
            content: { role: "model", parts: [{ text: JSON.stringify(classify(prompt)) }] },
            finishReason: "STOP",
          },
        ],
        usageMetadata: { promptTokenCount: 400, candidatesTokenCount: 80, totalTokenCount: 480 },
      });
    }

    case "api.resend.com":
      await readBody(req);
      await sleep(150);
      return json(res, 200, { id: randomUUID() });

    case "alerts.invalid":
      await readBody(req);
      await sleep(120);
      res.writeHead(204).end();
      return;

    case "challenges.cloudflare.com":
      await readBody(req);
      return json(res, 200, { success: true });

    default:
      return json(res, 404, { error: `mock: no fake for ${host}` });
  }
}

reset();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://mock");
    if (url.pathname === "/__calls") return json(res, 200, calls);
    if (url.pathname === "/__reset" && req.method === "POST") {
      reset();
      return json(res, 200, { ok: true });
    }
    const match = url.pathname.match(/^\/__ext\/([^/]+)(\/.*)?$/);
    if (match) return await external(req, res, match[1], `${match[2] ?? "/"}${url.search}`);
    if (url.pathname === "/") return json(res, 200, { ok: true });
    return json(res, 404, { error: "not found" });
  } catch (err) {
    console.error("[mock]", err);
    json(res, 500, { error: String(err) });
  }
}).listen(PORT, "127.0.0.1", () => console.log(`[mock] services on http://127.0.0.1:${PORT}`));

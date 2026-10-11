import { JWT } from "google-auth-library";

// The clinic's inquiry log: one row per inquiry in a Google Sheet.
// Auth is a service account the sheet is shared with (Editor).

const TAB = process.env.GOOGLE_SHEET_TAB || "Inquiries";
const API = "https://sheets.googleapis.com/v4/spreadsheets";

export const STATUSES = {
  readyToSend: "Ready to send",
  sent: "Sent",
  needsApproval: "Needs approval",
  spam: "Spam (no reply)",
  aiFailed: "AI failed",
} as const;
export type Status = (typeof STATUSES)[keyof typeof STATUSES];

export type InquiryRow = {
  id: string;
  receivedAt: string; // ISO timestamp
  name: string;
  email: string;
  phone: string;
  preferredTime: string;
  message: string;
  intent: string;
  urgency: string;
  confidence: string;
  summary: string;
  draftReply: string;
  status: Status;
};

// Column order in the sheet. Keep `id` first so rows can be found later.
const COLUMNS: { key: keyof InquiryRow; header: string }[] = [
  { key: "id", header: "ID" },
  { key: "receivedAt", header: "Date" },
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "preferredTime", header: "Preferred time" },
  { key: "message", header: "Message" },
  { key: "intent", header: "Intent" },
  { key: "urgency", header: "Urgency" },
  { key: "confidence", header: "Confidence" },
  { key: "summary", header: "Summary" },
  { key: "draftReply", header: "Draft reply" },
  { key: "status", header: "Status" },
];

let auth: JWT | undefined;

function sheetId() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID is not set");
  return id;
}

function getAuth() {
  if (!auth) {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    if (!email || !key) throw new Error("Google service account env vars are not set");
    auth = new JWT({
      email,
      // Hosts that don't expand "\n" in env values pass it through literally.
      key: key.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return auth;
}

async function sheetsFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token } = await getAuth().getAccessToken();
  const res = await fetch(`${API}/${sheetId()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Google Sheets ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

const range = (r: string) => encodeURIComponent(`'${TAB}'!${r}`);

let ready: Promise<void> | undefined;

// Creates the tab and header row the first time, so a blank sheet just works.
function ensureTab() {
  ready ??= (async () => {
    const meta = await sheetsFetch<{ sheets: { properties: { title: string } }[] }>(
      "?fields=sheets.properties.title",
    );
    if (!meta.sheets.some((s) => s.properties.title === TAB)) {
      await sheetsFetch(":batchUpdate", {
        method: "POST",
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: TAB } } }] }),
      });
    }
    const header = await sheetsFetch<{ values?: string[][] }>(`/values/${range("A1:M1")}`);
    if (!header.values?.[0]?.length) {
      await sheetsFetch(`/values/${range("A1")}?valueInputOption=RAW`, {
        method: "PUT",
        body: JSON.stringify({ values: [COLUMNS.map((c) => c.header)] }),
      });
    }
  })().catch((err) => {
    ready = undefined; // retry on the next call
    throw err;
  });
  return ready;
}

export async function appendInquiry(row: InquiryRow) {
  await ensureTab();
  await sheetsFetch(
    `/values/${range("A:M")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [COLUMNS.map((c) => row[c.key])] }),
    },
  );
}

export async function listInquiries(): Promise<(InquiryRow & { rowNumber: number })[]> {
  await ensureTab();
  const data = await sheetsFetch<{ values?: string[][] }>(`/values/${range("A2:M")}`);
  return (data.values ?? [])
    .map((values, i) => {
      const row = Object.fromEntries(COLUMNS.map((c, j) => [c.key, values[j] ?? ""]));
      return { ...(row as InquiryRow), rowNumber: i + 2 };
    })
    .filter((r) => r.id)
    .reverse(); // newest first
}

export async function updateInquiry(
  rowNumber: number,
  changes: Partial<Pick<InquiryRow, "draftReply" | "status">>,
) {
  const writes = Object.entries(changes).map(([key, value]) => {
    const col = String.fromCharCode(65 + COLUMNS.findIndex((c) => c.key === key));
    return { range: `'${TAB}'!${col}${rowNumber}`, values: [[value]] };
  });
  await sheetsFetch("/values:batchUpdate", {
    method: "POST",
    body: JSON.stringify({ valueInputOption: "RAW", data: writes }),
  });
}

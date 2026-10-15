import { writeFile } from "node:fs/promises";
import { expect, test, type BrowserContext } from "@playwright/test";
import { DEMO_PASSWORD, MOCK_URL } from "./support/env";

const VIEWPORT = { width: 1280, height: 800 };
const OUT = "test-results/demo/lead-autopilot";

// Stands in for Cloudflare's Turnstile script in the browser: renders a small
// "verified" note and hands the form a token right away (the server-side check
// goes to the local mock).
const FAKE_TURNSTILE = `window.turnstile = {
  render(el, opts) {
    el.innerHTML = '<p style="display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid #d5d9d6;border-radius:8px;font:500 14px system-ui;color:#2f5d50">&#10003; Verified human (demo)</p>';
    setTimeout(() => opts.callback("demo-token"), 50);
    return "demo";
  },
  reset() {},
  remove() {},
};`;

// React keeps a Suspense fallback ("Loading inquiries…") on screen for at least
// 300ms on client-side navigations, even when the data is already there. For
// the clip, hold the previous view until the new one is ready instead, like a
// full page load would. Purely cosmetic, recording only.
function holdPreviousViewDuringLoading() {
  let saved: { node: Node; top: number; bg: string } | null = null;
  let overlay: HTMLElement | null = null;
  new MutationObserver(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const loading = [...main.querySelectorAll("p")].some((p) => p.textContent?.startsWith("Loading inquir"));
    if (loading) {
      if (!overlay && saved) {
        overlay = document.createElement("div");
        overlay.style.cssText = `position:fixed;left:0;right:0;bottom:0;top:${saved.top}px;z-index:50;background:${saved.bg}`;
        overlay.appendChild(saved.node);
        document.body.appendChild(overlay);
      }
      return;
    }
    overlay?.remove();
    overlay = null;
    saved = {
      node: main.cloneNode(true),
      top: main.getBoundingClientRect().top,
      bg: getComputedStyle(main.parentElement ?? document.body).backgroundColor,
    };
  }).observe(document, { subtree: true, childList: true, characterData: true });
}

// The browser may only talk to the app itself; Turnstile is faked, the rest is blocked.
async function isolate(context: BrowserContext) {
  await context.route(
    (url) => url.hostname !== "localhost",
    (route) =>
      route.request().url().startsWith("https://challenges.cloudflare.com/turnstile/")
        ? route.fulfill({ contentType: "text/javascript", body: FAKE_TURNSTILE })
        : route.abort(),
  );
}

/**
 * A ~15s tour for the portfolio site: a patient sends an urgent inquiry → the
 * AI tags it and drafts a reply → the owner's inbox → review and approve it.
 * Writes `lead-autopilot.webm` plus `lead-autopilot.json` (seconds of blank
 * lead-in to trim).
 */
test("record the Lead Autopilot demo", async ({ browser, context, page, request }) => {
  // Setup off camera: fresh seeded sheet, owner signed in, pages warmed.
  await request.post(`${MOCK_URL}/__reset`);
  await isolate(context);
  await page.goto("/dashboard/login");
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Inbox" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Send inquiry" })).toBeVisible();

  const rec = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUT, size: VIEWPORT },
  });
  await isolate(rec);
  await rec.addInitScript(holdPreviousViewDuringLoading);
  await rec.addCookies(await context.cookies());
  const started = Date.now();
  const p = await rec.newPage();
  const pause = (ms: number) => p.waitForTimeout(ms);

  // 1. A patient on the clinic site.
  await p.goto("/#inquiry");
  await p.evaluate(() => window.scrollBy(0, 60)); // keep the Send button in frame
  await expect(p.getByText("Verified human (demo)")).toBeVisible();
  await p.evaluate(() => document.fonts.ready);
  const leadIn = (Date.now() - started) / 1000;
  await pause(600);

  await p.getByLabel("Full name").pressSequentially("Ana Lim", { delay: 45 });
  await p.getByLabel("Email").pressSequentially("ana.lim@example.com", { delay: 30 });
  await p.getByText("Morning", { exact: true }).click();
  await p
    .getByLabel("How can we help?")
    .pressSequentially("Chipped a tooth and it hurts. Can I come in today?", { delay: 30 });
  await pause(300);
  await p.getByRole("button", { name: "Send inquiry" }).click();

  // 2. What Lead Autopilot did: tags, drafted reply, held for approval.
  const panel = p.getByText("What Lead Autopilot did");
  await expect(panel).toBeVisible();
  await p.evaluate(() =>
    document.querySelector("#inquiry [role=status] section")?.scrollIntoView({ behavior: "smooth", block: "center" }),
  );
  await pause(2600);

  // 3. The owner's inbox, with the new inquiry waiting on top.
  await p.goto("/dashboard");
  await expect(p.getByRole("cell", { name: "Ana Lim" })).toBeVisible();
  await pause(1800);

  // 4. Review the held reply and approve it.
  await p.getByRole("row", { name: /Ana Lim/ }).getByRole("link", { name: "Review" }).click();
  await expect(p.getByRole("button", { name: "Approve and send" })).toBeVisible();
  await pause(1500);
  await p.getByRole("button", { name: "Approve and send" }).click();
  await expect(p.getByText("Reply sent.")).toBeVisible();
  await pause(1800);

  const video = p.video()!;
  await rec.close();
  await video.saveAs(`${OUT}.webm`);
  await writeFile(`${OUT}.json`, JSON.stringify({ leadIn }, null, 2));

  // The AI call, the approved email and the owner alert all landed on the local mock.
  const calls = (await (await request.get(`${MOCK_URL}/__calls`)).json()) as { host: string }[];
  expect(calls.map((c) => c.host)).toEqual(expect.arrayContaining(["generativelanguage.googleapis.com", "api.resend.com", "alerts.invalid"]));
});

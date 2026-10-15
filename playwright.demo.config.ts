import { generateKeyPairSync } from "node:crypto";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { APP_PORT, DEMO_PASSWORD, MOCK_PORT, MOCK_URL } from "./tests/demo/support/env";

/**
 * Records the portfolio demo clip: `npm run demo:record`.
 *
 * Runs the production build (no dev indicator) with no real services:
 * - `.env.local` is never applied: __NEXT_PROCESSED_ENV tells Next the env is
 *   already loaded, and every key the app reads is set to a dummy value here.
 * - Every outgoing request from the server is redirected to a local mock
 *   (tests/demo/support/mock-services.mts) by a preload, so Gemini, Google
 *   Sheets, Resend, Discord and Turnstile are never contacted.
 */

// A throwaway key so google-auth-library can sign its (mocked) token request.
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const demoEnv = {
  __NEXT_PROCESSED_ENV: "true",
  NEXT_TELEMETRY_DISABLED: "1",
  NODE_OPTIONS: `--import=${resolve("tests/demo/support/redirect-external.mjs")}`,
  DEMO_MOCK_URL: MOCK_URL,

  AI_MODEL: "google/gemini-3.5-flash-lite",
  GOOGLE_GENERATIVE_AI_API_KEY: "demo-key",
  ANTHROPIC_API_KEY: "",
  AI_GATEWAY_API_KEY: "",
  VERCEL_OIDC_TOKEN: "",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "demo@demo.iam.gserviceaccount.com",
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: privateKey,
  GOOGLE_SHEET_ID: "demo-sheet",
  RESEND_API_KEY: "demo-key",
  EMAIL_FROM: "",
  EMAIL_TEST_RECIPIENT: "",
  OWNER_ALERT_WEBHOOK_URL: "https://alerts.invalid/webhook",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "demo-site-key",
  TURNSTILE_SECRET_KEY: "demo-secret",
  ADMIN_PASSWORD: DEMO_PASSWORD,
};

export default defineConfig({
  testDir: "./tests/demo",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 120_000,
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    video: "off",
    trace: "off",
    screenshot: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npx tsx tests/demo/support/mock-services.mts",
      url: MOCK_URL,
      env: { DEMO_MOCK_PORT: String(MOCK_PORT) },
      reuseExistingServer: false,
    },
    {
      command: `./node_modules/.bin/next build && ./node_modules/.bin/next start --port ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      env: demoEnv,
      // Never attach to a server started some other way (it could have real keys).
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});

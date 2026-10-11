# Lead Autopilot

Answers every patient inquiry for a small dental clinic in under a minute. AI tags each inquiry, logs it to Google Sheets, emails a drafted reply, and alerts the owner. Urgent or unclear inquiries wait for owner approval.

The demo client is **Pinecrest Dental**, a fictional clinic in Baguio City.

See [docs/PLAN.md](docs/PLAN.md) for the full plan, brand and build phases.

## Getting started

```bash
cp .env.example .env.local   # fill in keys as you reach each phase
npm install
npm run dev
```

Open http://localhost:3000.

## Stack

Next.js, TypeScript, Tailwind CSS, Vercel, AI SDK (Gemini, swappable to Claude), Google Sheets, Resend, Discord/Slack webhooks, Cloudflare Turnstile.

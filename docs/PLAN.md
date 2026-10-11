# Lead Autopilot: Project Plan

Source: [Lead Autopilot: Project Plan](https://claude.ai/code/artifact/0c2d7b5f-ad8e-485b-92b1-e6d984e03ea8) (2026-10-11)

## Overview

Lead Autopilot answers every patient inquiry for a small dental clinic in under a minute, day or night. It is the automation piece of a freelance portfolio: proof of connecting everyday business tools and using AI responsibly, not only building websites.

When someone submits the clinic's inquiry form, the system tags the message with AI, saves it to a Google Sheet, emails the person a drafted reply, and alerts the owner. Urgent or unclear inquiries wait for the owner's approval before any reply goes out.

The whole project runs on free tiers: Next.js, TypeScript, Tailwind CSS and Vercel.

## Brand: Pinecrest Dental

The fictional client is **Pinecrest Dental**, a family dental clinic in Baguio City (the City of Pines). Label it clearly as a demo business.

**Tagline:** Gentle dental care in the City of Pines.

**Story:** Dr. Andrea Reyes runs the clinic with two assistants. Inquiries arrive through the website, Facebook and phone, often at night. Replies take hours, and patients with urgent pain book elsewhere.

**Clinic details:** open Monday to Saturday, 9 AM to 6 PM. Services: cleanings, fillings, whitening, braces consultations, emergency care.

| Role | Name | Color | Use |
| --- | --- | --- | --- |
| Primary | Pine | #2F5D50 | Header, buttons, links |
| Background | Mist | #F4F1EA | Page background |
| Accent | Sunrise | #E0795B | Main call to action, urgent tags |
| Text | Slate | #1F2A30 | Body text |
| Soft | Sage | #DCE5DF | Cards, form fields |

**Fonts:** Fraunces for headings, Inter for body.

**Logo idea:** a simple pine tree whose outline doubles as a tooth, in Pine green.

**Voice:** warm, calm and plain, like a friendly receptionist: "Hi Maria, sorry to hear about the pain. We can see you today at 2 PM. Does that work?"

## How it works

1. Visitor submits the inquiry form.
2. `/api/inquiry` validates it and calls the AI (`classifyLead()`).
3. The inquiry is saved as a row in Google Sheets.
4. Routine → drafted reply is emailed right away. Urgent or unclear → marked "Needs approval", nothing sent.
5. The owner is alerted in Discord or Slack.
6. The owner approves (and can edit) held replies from the dashboard.

If the AI step fails, the inquiry is still saved, the owner is alerted and the patient gets a standard "we got your message" email.

## Accounts and setup

| Service | What it does | What you need |
| --- | --- | --- |
| GitHub | Stores the code | Repo `lead-autopilot` |
| Vercel | Hosts the site and API route | Connect it to the repo |
| Google AI Studio (Gemini) | Tags inquiries and drafts replies (swappable to Claude via `AI_MODEL`) | A free API key |
| Google Cloud | Lets the code write to Sheets | A service account and its JSON key |
| Google Sheets | The clinic's inquiry log | A sheet shared with the service account's email |
| Resend | Sends reply emails | An API key |
| Discord or Slack | Alerts the owner | A webhook URL |
| Cloudflare Turnstile | Blocks spam bots | Site key and secret key |

Keys go in `.env.local` and Vercel's environment variables (see `.env.example`). Never commit them.

## Build phases

**Phase 1: Project setup**
- [x] Create a Next.js app with TypeScript and Tailwind CSS
- [x] Add the Pinecrest colors and fonts to the Tailwind theme
- [x] Push to GitHub and deploy to Vercel

**Phase 2: Clinic site and inquiry form**
- [x] One-page Pinecrest Dental site: hero, services, hours, inquiry form
- [x] Form fields: name, email, phone, message, preferred time
- [x] Validate in the browser and on the server (Zod)
- [x] API route `/api/inquiry` that receives the form and returns a success message

**Phase 3: The AI step**
- [x] `classifyLead()` in its own file, calling the model set in `AI_MODEL` via the AI SDK
- [x] Return the JSON shape in AI design below
- [x] Run the 20 sample messages and fix the prompt until the tags look right

**Phase 4: Google Sheets log**
- [x] Sheet columns: date, name, email, message, intent, urgency, summary, draft reply, status
- [x] One row per inquiry from the API route

**Phase 5: Replies and alerts**
- [x] Routine: send the drafted reply right away via Resend
- [x] Urgent or unclear: mark "Needs approval", send nothing yet
- [x] Send every inquiry to the owner's Discord or Slack

**Phase 6: Owner dashboard**
- [x] Password-protected page listing inquiries with their tags
- [x] "Approve and send" button with an edit box for held drafts
- [x] "Minutes saved" counter (inquiries handled × 5 minutes)

**Phase 7: Demo mode and safety**
- [ ] Add the safety items below
- [ ] Show visitors the AI's result right after they submit
- [ ] Read-only view of the inquiry log for visitors

**Phase 8: Launch**
- [ ] Record the demo video and publish the case study

## AI design

The AI always answers in one JSON shape, enforced with a Zod schema via the AI SDK:

```json
{
  "intent": "booking | pricing | emergency | question | spam",
  "urgency": "low | medium | high",
  "confidence": 0.92,
  "summary": "Tooth pain since last night, wants a visit today",
  "draftReply": "Hi Maria, sorry to hear about the pain. We can see you today at 2 PM. Does that work?"
}
```

**The prompt** gives the AI: who it is (Pinecrest's receptionist), clinic details, rules (no medical advice, no price promises, always offer a time or callback), and the inquiry. Keep it in its own file.

**Approval rule:** if `urgency` is high, `intent` is emergency, or `confidence` < 0.7, the reply waits for owner approval.

**Test set:** write 20 sample messages before the prompt; rerun them after every prompt change.

| Type | Example | Expected result |
| --- | --- | --- |
| Routine booking | "Can I book a cleaning next Tuesday?" | booking, low, sent right away |
| Price question | "How much are braces?" | pricing, low, sent right away |
| Emergency | "My tooth is broken and bleeding" | emergency, high, waits for approval |
| Angry patient | "Nobody called me back yesterday!" | question, medium, waits for approval |
| Other language | "Pwede po ba bukas ng umaga?" | booking, reply in the same language |
| Spam | "Buy cheap SEO services now" | spam, no reply sent |

## Safety and reliability

- **Fallback:** if the AI call fails or times out, save with status "AI failed", alert the owner, send a standard "we got your message" email. No inquiry is lost.
- **Spam protection:** Cloudflare Turnstile plus a hidden honeypot field.
- **Rate limit:** at most 5 submissions per visitor per hour.
- **Secrets:** API keys only in environment variables, never in code or the browser.
- **Demo data only:** the free Gemini tier may train on inputs, so use fake data. For a paying client, switch `AI_MODEL` to a paid model (e.g. Claude).
- **Easy to swap:** all AI calls go through `classifyLead()`, and the model is one env var (`AI_MODEL`), so moving to Claude is a config change.

## Case study and launch

**Demo video (60 seconds):** a visitor submits an urgent message, the Discord alert arrives, the Sheet row appears, the owner approves the reply.

**Case study page (300 to 500 words):**
1. The problem: slow replies cost Pinecrest urgent patients.
2. The solution: what Lead Autopilot does, with the flow diagram.
3. Key decisions: owner approval, the fallback, spam protection.
4. Results: reply time, accuracy on the 20 test messages, minutes saved per week.
5. Try it: live demo, video, GitHub repo.
6. Tech stack, at the bottom.

**Portfolio updates:**
- [ ] Lead Autopilot as the first project card, with a "Read case study" button
- [ ] Public GitHub repo with a clear README and screenshots
- [ ] Share the video on LinkedIn

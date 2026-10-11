# Mockups

Reference designs from Stitch (project "Lead Autopilot – Pinecrest Dental"). Copy the layout and structure, not every detail. `docs/PLAN.md` wins wherever the two disagree.

| File | Page |
| --- | --- |
| `01-marketing-site` | Clinic homepage (desktop) |
| `02-inquiry-confirmation` | "Inquiry received" + behind-the-scenes demo |
| `03-dashboard` | Owner inbox |
| `04-review-approval` | Review and approve a held reply |
| `05-live-inquiry-log` | Public read-only log |
| `06-mobile-homepage` | Clinic homepage (mobile) |
| `logo.svg`, `hero-clinic.jpg` | Logo and hero photo |

## Use from the brand, not the mockups

- Fonts: Fraunces headings, Inter body (ignore Newsreader, Plus Jakarta Sans, JetBrains Mono).
- Colors: the Tailwind theme in `src/app/globals.css` (ignore the bluish backgrounds and rust/coral buttons).
- Copy: plain, warm receptionist voice. No medical terms.

## Leave out when building

- Anything about SMS, WhatsApp or "SMS & Email" channels: replies go by email only.
- "HIPAA & DPA-2012 Compliant", "Verified Patient", "Operatory 2 held", model/version labels, latency, run IDs.
- Jargon labels: "Execution Telemetry Pipeline", "Clinical Triage Synthesis", "Immediate Highland Triage".
- Dashboard extras: "Quick Dispatch", notification bell, filter-settings icon, "+14% vs last week", "System Active" pill.
- Review page extras: "1 of 3" pager, template snippets, SMS segment count, "Reject & archive".
- Marketing extras: map card coordinates/elevation, parking section, trust-badge row under the hero.
- Footer links to pages we don't have (Team & Philosophy, Patient Privacy).

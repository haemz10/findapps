# Automation Setup — the Leads Engine

`leads-engine.gs` runs the daily grind for you on Google's servers: it acknowledges new leads,
sends review requests when a job is done, and chases quiet quotes on a 3/7/14-day cadence.
**Free, no Make.com, no monthly fees.** You touch it once to install, then it's hands-off.

## Install (~15 min, one time)

1. **Create the sheet.** New Google Sheet → name it `Leads`. Rename the first tab to `Leads`.
   Put these headers in row 1 (exact order):
   ```
   Date | Name | Email | Phone | Suburb | Job | Source | Status | QuoteSentDate | FU1 | FU2 | FU3 | ReviewAsked | Notes
   ```
2. **Add the script.** `Extensions → Apps Script`. Delete the sample code, paste the whole of
   `leads-engine.gs`.
3. **Fill the CONFIG block** at the top: your name, business, Google review link, email.
   *(Get your review link: Google Business Profile → "Ask for reviews" → copy the short link.)*
4. **Authorize + schedule.** In the Apps Script toolbar pick the function `setup` → **Run**.
   Approve the Google permission prompt (it needs to read the sheet and send email as you).
   This installs a **daily 9am trigger** — you never run it again.
5. **(Optional) Instant reply on new enquiries.** If you collect leads with a **Google Form**,
   link the form to this sheet, then add a trigger: Apps Script → Triggers (clock icon) →
   Add Trigger → function `onLeadFormSubmit`, event `On form submit`.
6. **(Optional) SMS as well as email.** Add ClickSend username + API key to CONFIG. Leave blank
   to run email-only (recommended to start — email is free and needs no account).

## How you use it day to day (your ~5%)

You only ever change the **Status** column:
| You type in Status | What the engine does |
|---|---|
| `New` | (auto on Form) sends an instant acknowledgement |
| `Quoted` (+ fill `QuoteSentDate`) | auto follow-ups on day 3, 7, 14 |
| `Completed` | sends the review request (once) |
| `Won` / `Lost` | stops all follow-ups |

That's it. Marking a status takes 5 seconds per lead. Everything else sends itself.

## Test it before you trust it
1. Add a test row: your own email, `Status = Completed`. Run `runDaily` manually → you should
   get the review email.
2. Add another row: `Status = Quoted`, `QuoteSentDate` = 4 days ago. Run `runDaily` → you get
   follow-up #1, and column `FU1` fills in.
3. Clear the test rows. You're live.

## What still needs a human (and why it can't be automated)
- **Sending SMS** needs an SMS account (ClickSend/Twilio) under your billing — providers require
  a real identity. Email works with zero setup, so start there.
- **Replying to a customer who actually writes back** — that's a real conversation; use the
  prompts in `product/full-kit/01-prompt-library.md` to draft it in seconds.

> Safety notes: the script sends **email as you** and reads only this one sheet. Review the code
> before authorizing (you should never paste a script you haven't read). Keep the review link and
> config correct — a wrong link sends people nowhere.

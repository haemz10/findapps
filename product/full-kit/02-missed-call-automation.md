# Module 2 — The Missed-Call-to-Text Automation

**The single highest-ROI thing in this kit.** Research is consistent: most people who
ring a service business and get no answer **do not leave a voicemail and do not call back** —
they ring the next number. An automatic text back within a minute catches that lead.

You'll build it in three levels. Start at A (free, 5 minutes). Upgrade when you're ready.

---

## Level A — Phone-only (free, 5 minutes, do this today)

Your phone can already auto-reply to missed calls and texts.

**iPhone — "Driving Focus" auto-reply:**
1. Settings → Focus → Driving → **Auto-Reply**
2. Set to **All Contacts** (or Everyone)
3. Set the message (see template below)
4. Turn Driving Focus on while you work, or set it to auto-activate.

**Android (most phones) — via Google Voice or your dialer:**
- Google Voice: Settings → Do Not Disturb / message → set auto-text on missed calls.
- Or use your carrier's "missed call SMS" feature, or a free app like **SMS Auto Reply**.

**The auto-reply message (paste this, edit the brackets):**
```
Hi, it's [NAME] from [BUSINESS] — sorry I missed your call, I'm on a job.
Text me what you need and your suburb and I'll get straight back to you.
For emergencies call [EMERGENCY NUMBER].
```

That's it. Every missed call now gets an instant, professional reply. **You just stopped
leaking your most valuable leads.**

---

## Level B — Automated reply + logging (Make.com free plan, ~30 minutes)

This captures every enquiry into one place and drafts your reply for you.

**What it does:** New enquiry (SMS / web form / Facebook lead) → logs it to a Google Sheet →
sends an instant text back → pings you with a suggested reply.

**Build it:**
1. Create a free **Make.com** account.
2. Create a free **Google Sheet** called `Leads` with columns:
   `Date | Name | Phone | Suburb | Job | Source | Status | Quote sent | Review asked`
3. In Make, create a scenario:
   - **Trigger:** your lead source — e.g. *Webhook* (for a website form), *Facebook Lead Ads*,
     or *Email Parser* (if enquiries hit your inbox).
   - **Action 1 — Google Sheets → Add a Row:** map the lead's details in.
   - **Action 2 — Send SMS** (via ClickSend/Twilio module, or send yourself an email/Telegram
     ping if you'd rather text back manually): use the auto-reply template above.
4. Test with a fake lead. Confirm the row appears and the text sends.
5. Turn the scenario **ON**.

> Free-plan tip: Make's free tier gives 1,000 operations/month. Each lead uses ~2–3 operations,
> so that's roughly 300+ leads/month free. Plenty to start.

**The Google Sheet is now your whole business's memory** — every lead, its status, whether you
quoted, whether you asked for a review. Module 3 and 4 run off this sheet.

---

## Level C — Fully hands-off with AI drafting (when you're ready)

Add one more step so the reply is written *for the specific enquiry*, not a generic template.

1. In the same Make scenario, add an **HTTP / AI module** (Make has OpenAI/Claude modules,
   or call the API directly).
2. Feed it the lead's message plus **Prompt #1** from Module 1 as the system instruction.
3. Route the AI's draft to your phone (Telegram/email) so you **approve with one tap** before it sends —
   or send automatically once you trust it.

**Recommended:** keep a human tap for the first few weeks (you'll catch edge cases), then
flip to fully automatic for standard enquiries once you trust it.

---

### Guardrails (important)
- **Always give an emergency path** in auto-replies — some trades get genuine emergencies.
- **Don't auto-send prices** without a human check early on. Auto-send *acknowledgements*, draft *prices*.
- **Check the Leads sheet daily** for the first two weeks so nothing slips.

Next: turn finished jobs into reviews and rescue quiet quotes → `03-sequences.md`

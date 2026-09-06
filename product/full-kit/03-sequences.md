# Module 3 — Review & Follow-Up Sequences

Two automated sequences that quietly grow your revenue and reputation while you work.
Both run off the `Leads` Google Sheet you built in Module 2.

---

## Sequence 1 — The Review Engine (grows your Google ranking)

More 5-star reviews = higher in local search = more calls. This makes it automatic.

**The trigger:** a job's `Status` in your sheet changes to `Completed`.

**Build it (Make.com):**
1. New scenario. **Trigger:** Google Sheets → *Watch Rows* where `Status = Completed`
   and `Review asked` is empty.
2. **Delay:** wait 2 hours (or next morning) — feels natural, not pushy.
3. **Action:** Send SMS/email using the message below.
4. **Update the sheet:** set `Review asked = Yes` so nobody gets asked twice.

**The message (from Prompt #21 — personalise per job):**
```
Hi [NAME], thanks again for having me out for the [JOB] today — hope it's all sorted!
If you've got 30 seconds, a quick Google review would genuinely help my small business:
[GOOGLE REVIEW LINK]
No worries if not — really appreciate your business either way. — [NAME], [BUSINESS]
```

**Get your Google review link:** Google Business Profile → "Ask for reviews" → copy the short link.
Paste it as `[GOOGLE REVIEW LINK]`.

**Follow-up (optional, 3 days later, only if no review yet):** one gentle reminder, then stop.
Never ask a third time.

> Expect roughly 1 in 3 asked customers to leave a review when you ask this way. Ask 10 a week,
> and your profile transforms in a couple of months.

---

## Sequence 2 — The Quote Rescue (wins back lost jobs)

Most quotes that go quiet aren't a "no" — they're a "not yet" that never got followed up.
This sequence follows up so you don't have to remember.

**The trigger:** `Quote sent` date is set, `Status` still `Quoted` (not Won/Lost).

**The cadence:**
| Day | Message | Prompt |
|---|---|---|
| Day 3 | Friendly nudge — remind of value, easy to reply | #15 |
| Day 7 | Offer to answer questions / adjust scope | #16 |
| Day 14 | "I'll close this off unless I hear back" | #17 |

**Build it (Make.com):**
1. New scenario, **scheduled daily** (e.g. 9am).
2. **Search rows** where `Status = Quoted`.
3. For each, compare today's date to `Quote sent`:
   - 3 days → send Day-3 message, tag `FU1 sent`
   - 7 days → send Day-7 message, tag `FU2 sent`
   - 14 days → send Day-14 message, set `Status = Lost` unless they reply
4. When a customer replies "yes" → you set `Status = Won` and the sequence stops.

**The three messages (pre-written, personalise the job):**

*Day 3:*
```
Hi [NAME], just checking you got my quote for the [JOB]? Happy to walk you through anything
or tweak it to suit your budget. Keen to help when you're ready. — [NAME]
```
*Day 7:*
```
Hi [NAME], no rush at all — just wanted to see if you had any questions on the [JOB] quote.
If the timing or scope needs adjusting, I can sort that. Let me know either way?
```
*Day 14:*
```
Hi [NAME], I'll close this one off so I'm not pestering you — but if you'd still like the [JOB]
done, just reply and I'll get you booked in. Cheers for considering me. — [NAME]
```

> A simple 3-touch follow-up typically recovers **10–20% of "dead" quotes**. On a quiet week
> that's often a whole extra job — for messages that send themselves.

---

## Don't want to build automations yet?

Every sequence above works **manually** too:
- Save the messages as text shortcuts on your phone.
- Once a day, glance at your `Leads` sheet and send whichever are due.

Five minutes a day, same result. Automate it once the volume justifies it.

Next: your simple weekly routine to keep it all humming → `04-weekly-sop.md`

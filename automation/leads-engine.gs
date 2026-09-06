/**
 * ReplyFast — Leads Engine (Google Apps Script)
 * ------------------------------------------------------------------
 * Runs the 95%: logs leads, sends review requests, and chases quiet quotes
 * automatically on Google's servers. You paste this once and authorize it — then
 * it runs itself on a daily timer. No Make.com, no monthly fees.
 *
 * SETUP (the one-time 5% — see automation/README.md for screenshots-level detail):
 *   1. Create a Google Sheet named "Leads" with a tab "Leads" and these headers in row 1:
 *      Date | Name | Email | Phone | Suburb | Job | Source | Status | QuoteSentDate |
 *      FU1 | FU2 | FU3 | ReviewAsked | Notes
 *   2. Extensions -> Apps Script. Delete the sample, paste THIS file.
 *   3. Edit the CONFIG block below (your name, business, review link).
 *   4. Run `setup()` once and approve the permissions prompt.
 *   5. Done. It now runs every day at 9am automatically.
 *
 * Statuses you set by hand (your only ongoing touch):
 *   - "New"        -> a fresh lead (auto-set if leads arrive via Form)
 *   - "Quoted"     -> you sent a quote (also fill QuoteSentDate)
 *   - "Won"/"Lost" -> outcome (stops follow-ups)
 *   - "Completed"  -> job finished (triggers the review request)
 */

// ====================== CONFIG — edit these ======================
var CONFIG = {
  ownerName:    "[YOUR NAME]",
  business:     "[YOUR BUSINESS]",
  fromLabel:    "[YOUR BUSINESS]",          // sender name on emails
  reviewLink:   "[YOUR GOOGLE REVIEW LINK]",
  replyToEmail: "[YOUR EMAIL]",
  sendHour:     9,                          // hour of day (0-23) to run
  // Optional SMS via ClickSend (leave blank to use email only):
  clicksendUser: "",                        // ClickSend username
  clicksendKey:  ""                         // ClickSend API key
};
// =================================================================

var SHEET_NAME = "Leads";
var COL = { date:1, name:2, email:3, phone:4, suburb:5, job:6, source:7,
           status:8, quoteDate:9, fu1:10, fu2:11, fu3:12, reviewAsked:13, notes:14 };

/** Run once to install the daily trigger + validate config. */
function setup() {
  // Remove any existing triggers for this function, then add one.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "runDaily") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("runDaily").timeBased().everyDays(1).atHour(CONFIG.sendHour).create();
  var sh = sheet_();
  Logger.log("Setup complete. Daily run scheduled at %s:00. Rows found: %s",
             CONFIG.sendHour, sh.getLastRow() - 1);
}

/** The daily automation. Runs review requests + quote follow-ups. */
function runDaily() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return;
  var data = sh.getRange(2, 1, last - 1, COL.notes).getValues();
  var today = startOfDay_(new Date());

  for (var i = 0; i < data.length; i++) {
    var r = i + 2;                       // sheet row
    var row = data[i];
    var status = String(row[COL.status - 1] || "").trim().toLowerCase();

    // --- Review request: job Completed, not yet asked ---
    if (status === "completed" && !truthy_(row[COL.reviewAsked - 1])) {
      sendReviewRequest_(row);
      sh.getRange(r, COL.reviewAsked).setValue("Yes " + fmtDate_(today));
      continue;
    }

    // --- Quote follow-ups: still Quoted, cadence day 3 / 7 / 14 ---
    if (status === "quoted") {
      var qDate = row[COL.quoteDate - 1];
      if (!qDate) continue;
      var days = daysBetween_(startOfDay_(new Date(qDate)), today);
      if (days >= 3 && !truthy_(row[COL.fu1 - 1])) {
        sendFollowUp_(row, 1);
        sh.getRange(r, COL.fu1).setValue("Sent " + fmtDate_(today));
      } else if (days >= 7 && !truthy_(row[COL.fu2 - 1])) {
        sendFollowUp_(row, 2);
        sh.getRange(r, COL.fu2).setValue("Sent " + fmtDate_(today));
      } else if (days >= 14 && !truthy_(row[COL.fu3 - 1])) {
        sendFollowUp_(row, 3);
        sh.getRange(r, COL.fu3).setValue("Sent " + fmtDate_(today));
        sh.getRange(r, COL.status).setValue("Lost");  // auto-close after last touch
      }
    }
  }
}

/**
 * Optional: connect a Google Form (enquiry form) to this sheet, then set the
 * Form's "on form submit" trigger to call onLeadFormSubmit. New leads get an
 * instant acknowledgement + Status=New automatically.
 */
function onLeadFormSubmit(e) {
  try {
    var sh = sheet_();
    var r = sh.getLastRow();
    sh.getRange(r, COL.date).setValue(new Date());
    if (!sh.getRange(r, COL.status).getValue()) sh.getRange(r, COL.status).setValue("New");
    if (!sh.getRange(r, COL.source).getValue()) sh.getRange(r, COL.source).setValue("Form");
    var row = sh.getRange(r, 1, 1, COL.notes).getValues()[0];
    sendInstantReply_(row);
  } catch (err) { Logger.log("onLeadFormSubmit error: " + err); }
}

// ---------------------- Message senders ----------------------

function sendInstantReply_(row) {
  var name = firstName_(row[COL.name - 1]);
  var subject = "Thanks for your enquiry — " + CONFIG.business;
  var body = "Hi " + name + ",\n\n" +
    "Thanks for getting in touch with " + CONFIG.business + " — I've got your message and " +
    "I'll be back to you shortly. If it's urgent, just reply to this email or call.\n\n" +
    "Cheers,\n" + CONFIG.ownerName + "\n" + CONFIG.business;
  deliver_(row, subject, body);
}

function sendReviewRequest_(row) {
  var name = firstName_(row[COL.name - 1]);
  var job = row[COL.job - 1] || "the job";
  var subject = "Quick favour, " + name + "? 🙏";
  var body = "Hi " + name + ",\n\n" +
    "Thanks again for having me out for " + job + " — hope it's all sorted!\n\n" +
    "If you've got 30 seconds, a quick Google review would genuinely help my small business:\n" +
    CONFIG.reviewLink + "\n\n" +
    "No worries at all if not — really appreciate your business either way.\n\n" +
    CONFIG.ownerName + ", " + CONFIG.business;
  deliver_(row, subject, body);
}

function sendFollowUp_(row, step) {
  var name = firstName_(row[COL.name - 1]);
  var job = row[COL.job - 1] || "your job";
  var subject, body;
  if (step === 1) {
    subject = "Your quote for " + job;
    body = "Hi " + name + ",\n\nJust checking you got my quote for " + job + "? Happy to walk " +
      "you through anything or tweak it to suit your budget. Keen to help when you're ready.\n\n" +
      "— " + CONFIG.ownerName;
  } else if (step === 2) {
    subject = "Any questions on the quote?";
    body = "Hi " + name + ",\n\nNo rush at all — just wanted to see if you had any questions on " +
      "the " + job + " quote. If the timing or scope needs adjusting, I can sort that. Let me " +
      "know either way?\n\n— " + CONFIG.ownerName;
  } else {
    subject = "Closing this off";
    body = "Hi " + name + ",\n\nI'll close this one off so I'm not pestering you — but if you'd " +
      "still like " + job + " done, just reply and I'll get you booked in. Cheers for " +
      "considering me.\n\n— " + CONFIG.ownerName;
  }
  deliver_(row, subject, body);
}

// ---------------------- Delivery + helpers ----------------------

/** Sends by email; also SMS if a phone + ClickSend creds are present. */
function deliver_(row, subject, body) {
  var email = row[COL.email - 1];
  if (email) {
    MailApp.sendEmail({
      to: email, subject: subject, body: body,
      name: CONFIG.fromLabel, replyTo: CONFIG.replyToEmail || undefined
    });
  }
  var phone = row[COL.phone - 1];
  if (phone && CONFIG.clicksendUser && CONFIG.clicksendKey) sendSms_(phone, body);
}

function sendSms_(to, message) {
  try {
    var payload = { messages: [{ source: "gas", to: String(to), body: message.substring(0, 480) }] };
    UrlFetchApp.fetch("https://rest.clicksend.com/v3/sms/send", {
      method: "post", contentType: "application/json",
      headers: { Authorization: "Basic " +
        Utilities.base64Encode(CONFIG.clicksendUser + ":" + CONFIG.clicksendKey) },
      payload: JSON.stringify(payload), muteHttpExceptions: true
    });
  } catch (err) { Logger.log("SMS error: " + err); }
}

function sheet_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('No tab named "' + SHEET_NAME + '". Rename your tab to Leads.');
  return sh;
}
function firstName_(n) { return String(n || "there").trim().split(/\s+/)[0]; }
function truthy_(v) { return v !== "" && v !== null && v !== undefined; }
function startOfDay_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function daysBetween_(a, b) { return Math.round((b - a) / 86400000); }
function fmtDate_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd"); }

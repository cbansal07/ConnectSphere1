import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Reminders 24hrs before event
crons.daily(
  "send-reminders",
  { hourUTC: 12, minuteUTC: 0 },
  internal.emails.sendEventReminders
);

// Feedback emails 24hrs after event
crons.daily(
  "send-feedback-requests",
  { hourUTC: 12, minuteUTC: 30 },
  internal.emails.sendFeedbackRequests
);

export default crons;

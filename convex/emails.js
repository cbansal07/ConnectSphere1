import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const sendTicketEmail = internalAction({
  args: {
    to: v.string(),
    eventName: v.string(),
    ticketId: v.string(),
    eventDate: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.warn("No RESEND_API_KEY found, skipping email.");
      return;
    }

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev", // Replace with a verified domain
          to: args.to,
          subject: `Your Ticket for ${args.eventName}`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h2>You are registered for ${args.eventName}!</h2>
              <p><strong>Date:</strong> ${args.eventDate}</p>
              <p><strong>Location:</strong> ${args.location}</p>
              <br/>
              <p>Your ticket ID is <strong>${args.ticketId}</strong>.</p>
              <p>Show this email or login to the portal to view your QR code for check-in.</p>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.error("Failed to send ticket email:", e);
    }
  },
});

export const broadcastAnnouncement = internalAction({
  args: {
    eventId: v.id("events"),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.warn("No RESEND_API_KEY found, skipping broadcast.");
      return;
    }

    // Get event and attendees
    const event = await ctx.runQuery(internal.registrations.getEventForBroadcast, { eventId: args.eventId });
    const attendees = await ctx.runQuery(internal.registrations.getAttendeesForBroadcast, { eventId: args.eventId });

    if (!event || attendees.length === 0) return;

    const emails = attendees.map(a => a.attendeeEmail);

    try {
      // Resend allows up to 50 bcc recipients per request. For simplicity, looping or batching.
      // Doing single request with BCC for this prototype.
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: event.organizerEmail || "noreply@connectsphere.com",
          bcc: emails,
          subject: `Update regarding ${event.title}: ${args.subject}`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h2>Announcement from the Organizer of ${event.title}</h2>
              <p style="white-space: pre-wrap;">${args.message}</p>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.error("Failed to send broadcast email:", e);
    }
  },
});

export const sendEventReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;
    const data = await ctx.runQuery(internal.registrations.getUpcomingEventsForReminders);
    for (const item of data) {
      if (item.attendees.length === 0) continue;
      const emails = item.attendees.map(a => a.attendeeEmail);
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: item.event.organizerEmail || "noreply@connectsphere.com",
            bcc: emails,
            subject: `Reminder: ${item.event.title} is tomorrow!`,
            html: `<div><h2>${item.event.title} is starting in 24 hours!</h2><p>Get your tickets ready.</p></div>`,
          }),
        });
      } catch (e) { console.error(e); }
    }
  },
});

export const sendFeedbackRequests = internalAction({
  args: {},
  handler: async (ctx) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return;
    const data = await ctx.runQuery(internal.registrations.getPastEventsForFeedback);
    for (const item of data) {
      if (item.attendees.length === 0) continue;
      const emails = item.attendees.map(a => a.attendeeEmail);
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: item.event.organizerEmail || "noreply@connectsphere.com",
            bcc: emails,
            subject: `How was ${item.event.title}?`,
            html: `<div><h2>Thank you for attending ${item.event.title}!</h2><p>Please click here to leave feedback.</p></div>`,
          }),
        });
      } catch (e) { console.error(e); }
    }
  },
});


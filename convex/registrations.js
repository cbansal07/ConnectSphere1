import { internal } from "./_generated/api";
import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Generate unique QR code ID
function generateQRCode() {
  return `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Register for an event
export const registerForEvent = mutation({
  args: {
    eventId: v.id("events"),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Unauthenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if event is full
    if (event.registrationCount >= event.capacity) {
      throw new Error("Event is full");
    }

    // Check if user already registered
    const existingRegistration = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();

    if (existingRegistration) {
      throw new Error("You are already registered for this event");
    }

    // Create registration
    const qrCode = generateQRCode();
    const registrationId = await ctx.db.insert("registrations", {
      eventId: args.eventId,
      userId: user._id,
      attendeeName: args.attendeeName,
      attendeeEmail: args.attendeeEmail,
      qrCode: qrCode,
      checkedIn: false,
      status: "confirmed",
      registeredAt: Date.now(),
    });

    // Update event registration count
    await ctx.db.patch(args.eventId, {
      registrationCount: event.registrationCount + 1,
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendTicketEmail, { to: args.attendeeEmail, eventName: event.title, ticketId: qrCode, eventDate: new Date(event.startDate).toLocaleDateString(), location: event.location || 'Online' });
    return registrationId;
  },
});

// Check if user is registered for an event
export const checkRegistration = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    if (!user) return null;

    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();

    return registration;
  },
});

// Get user's registrations (tickets)
export const getMyRegistrations = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return [];

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Fetch event details for each registration
    const registrationsWithEvents = await Promise.all(
      registrations.map(async (reg) => {
        const event = await ctx.db.get(reg.eventId);
        return {
          ...reg,
          event,
        };
      })
    );

    return registrationsWithEvents;
  },
});

// Cancel registration
export const cancelRegistration = mutation({
  args: { registrationId: v.id("registrations") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Unauthenticated");

    const registration = await ctx.db.get(args.registrationId);
    if (!registration) {
      throw new Error("Registration not found");
    }

    // Check if user owns this registration
    if (registration.userId !== user._id) {
      throw new Error("You are not authorized to cancel this registration");
    }

    const event = await ctx.db.get(registration.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Update registration status
    await ctx.db.patch(args.registrationId, {
      status: "cancelled",
    });

    // Decrement event registration count
    if (event.registrationCount > 0) {
      await ctx.db.patch(registration.eventId, {
        registrationCount: event.registrationCount - 1,
      });
    }

    return { success: true };
  },
});

// Get registrations for an event (for organizers)
export const getEventRegistrations = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Unauthenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is the organizer
    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to view registrations");
    }

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return registrations;
  },
});

// Check-in attendee with QR code
export const checkInAttendee = mutation({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Unauthenticated");

    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .unique();

    if (!registration) {
      throw new Error("Invalid QR code");
    }

    const event = await ctx.db.get(registration.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is the organizer
    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to check in attendees");
    }

    // Check if already checked in
    if (registration.checkedIn) {
      return {
        success: false,
        message: "Already checked in",
        registration,
      };
    }

    // Check in
    await ctx.db.patch(registration._id, {
      checkedIn: true,
      checkedInAt: Date.now(),
    });

    return {
      success: true,
      message: "Check-in successful",
      registration: {
        ...registration,
        checkedIn: true,
        checkedInAt: Date.now(),
      },
    };
  },
});

export const getEventForBroadcast = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const getAttendeesForBroadcast = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("registrations")
      .withIndex("by_event_status", (q) =>
        q.eq("eventId", args.eventId).eq("status", "confirmed")
      )
      .collect();
  },
});

export const getUpcomingEventsForReminders = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const in24Hours = now + 24 * 60 * 60 * 1000;
    const tomorrow = in24Hours + 60 * 60 * 1000;
    const events = await ctx.db.query("events").filter(q => q.and(q.gte(q.field("startDate"), in24Hours), q.lt(q.field("startDate"), tomorrow))).collect();
    
    const result = [];
    for (const event of events) {
      const attendees = await ctx.db.query("registrations").withIndex("by_event_status", q => q.eq("eventId", event._id).eq("status", "confirmed")).collect();
      result.push({ event, attendees });
    }
    return result;
  },
});

export const getPastEventsForFeedback = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ago24Hours = now - 24 * 60 * 60 * 1000;
    const yesterday = ago24Hours - 60 * 60 * 1000;
    const events = await ctx.db.query("events").filter(q => q.and(q.gte(q.field("endDate"), yesterday), q.lt(q.field("endDate"), ago24Hours))).collect();
    
    const result = [];
    for (const event of events) {
      const attendees = await ctx.db.query("registrations").withIndex("by_event_status", q => q.eq("eventId", event._id).eq("status", "confirmed")).collect();
      result.push({ event, attendees });
    }
    return result;
  },
});

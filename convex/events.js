import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new event
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    timezone: v.string(),
    locationType: v.union(v.literal("physical"), v.literal("online")),
    venue: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    capacity: v.number(),
    ticketType: v.union(v.literal("free"), v.literal("paid")),
    ticketPrice: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    themeColor: v.optional(v.string()),
    hasPro: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.runQuery(internal.users.getCurrentUser);
      if (!user) throw new Error("Unauthenticated");

      const userFreeEvents = user.freeEventsCreated || 0;

      // SERVER-SIDE CHECK: Verify event limit for Free users
      if (!args.hasPro && userFreeEvents >= 100) {
        throw new Error(
          "Free event limit reached. Please upgrade to Pro to create more events."
        );
      }

      // SERVER-SIDE CHECK: Verify custom color usage
      const defaultColor = "#1e3a8a";
      if (!args.hasPro && args.themeColor && args.themeColor !== defaultColor) {
        throw new Error(
          "Custom theme colors are a Pro feature. Please upgrade to Pro."
        );
      }

      // Force default color for Free users
      const themeColor = args.hasPro ? args.themeColor : defaultColor;

      // Resolve storage URL if uploaded custom image
      let coverImageUrl = args.coverImage;
      if (args.coverImageStorageId) {
        coverImageUrl = await ctx.storage.getUrl(args.coverImageStorageId);
      }

      // Generate slug from title
      const slug = args.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { hasPro, coverImageStorageId, coverImage, ...insertData } = args;

      // Create event
      const eventId = await ctx.db.insert("events", {
        ...insertData,
        themeColor, // Use validated color
        coverImage: coverImageUrl,
        slug: `${slug}-${Date.now()}`,
        organizerId: user._id,
        organizerName: user.name,
        registrationCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update user's free event count
      await ctx.db.patch(user._id, {
        freeEventsCreated: userFreeEvents + 1,
      });

      return eventId;
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  },
});

// Get event by slug
export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return event;
  },
});

// Get events by organizer
export const getMyEvents = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return [];

    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .order("desc")
      .collect();

    return events;
  },
});

// Delete event
export const deleteEvent = mutation({
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
      throw new Error("You are not authorized to delete this event");
    }

    // Delete all registrations for this event
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const registration of registrations) {
      await ctx.db.delete(registration._id);
    }

    // Delete the event
    await ctx.db.delete(args.eventId);

    // Update free event count if it was a free event
    if (event.ticketType === "free" && user.freeEventsCreated > 0) {
      await ctx.db.patch(user._id, {
        freeEventsCreated: user.freeEventsCreated - 1,
      });
    }

    return { success: true };
  },
});

export const incrementPageViews = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return;
    await ctx.db.patch(args.eventId, {
      pageViews: (event.pageViews || 0) + 1,
    });
  },
});


export const submitFeedback = mutation({
  args: { 
    eventId: v.id("events"),
    rating: v.number(),
    comment: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Unauthenticated");

    // Ensure user was registered for the event
    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_event_user", q => q.eq("eventId", args.eventId).eq("userId", user._id))
      .unique();
      
    if (!registration || registration.status !== "confirmed") {
      throw new Error("You must be a confirmed attendee to leave feedback");
    }
    
    // Check if feedback already submitted
    const existingFeedback = await ctx.db
      .query("event_feedback")
      .filter(q => q.and(q.eq(q.field("eventId"), args.eventId), q.eq(q.field("userId"), user._id)))
      .first();
      
    if (existingFeedback) {
      throw new Error("You have already submitted feedback for this event");
    }

    await ctx.db.insert("event_feedback", {
      eventId: args.eventId,
      userId: user._id,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });
    
    return { success: true };
  }
});


export const getEventFeedback = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("event_feedback")
      .filter(q => q.eq(q.field("eventId"), args.eventId))
      .order("desc")
      .collect();
  }
});


export const getOrganizerRating = query({
  args: { organizerId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", q => q.eq("organizerId", args.organizerId))
      .collect();
      
    if (events.length === 0) return 0;
    
    let totalRating = 0;
    let count = 0;
    
    for (const event of events) {
      const feedback = await ctx.db
        .query("event_feedback")
        .filter(q => q.eq(q.field("eventId"), event._id))
        .collect();
      for (const f of feedback) {
        totalRating += f.rating;
        count++;
      }
    }
    
    if (count === 0) return 0;
    return (totalRating / count).toFixed(1);
  }
});


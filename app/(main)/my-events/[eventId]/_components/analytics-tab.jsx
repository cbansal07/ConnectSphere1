
"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Star } from "lucide-react";

export default function AnalyticsTab({ event, stats }) {
  const { data: feedbackData } = useConvexQuery(api.events.getEventFeedback, { eventId: event._id });
  const feedback = feedbackData || [];
  const averageRating = feedback.length > 0 
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : 0;

  // In a real app, this would come from a complex Convex query grouping by date.
  // For now, we simulate a curve based on the total page views.
  const viewsData = [
    { name: "Day 1", views: Math.floor((event.pageViews || 0) * 0.1) },
    { name: "Day 2", views: Math.floor((event.pageViews || 0) * 0.2) },
    { name: "Day 3", views: Math.floor((event.pageViews || 0) * 0.3) },
    { name: "Day 4", views: Math.floor((event.pageViews || 0) * 0.4) },
    { name: "Today", views: Math.floor((event.pageViews || 0) * 0.5) },
  ];

  const salesData = [
    { name: "Confirmed", count: stats.totalRegistrations },
    { name: "Pending", count: stats.pendingCount },
    { name: "Checked In", count: stats.checkedInCount },
  ];

  return (
    <div className="space-y-8">
      <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Total Page Views</h3>
          <p className="text-3xl font-bold mt-2">{event.pageViews || 0}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Conversion Rate</h3>
          <p className="text-3xl font-bold mt-2">
            {event.pageViews > 0 
              ? Math.round((stats.totalRegistrations / event.pageViews) * 100) 
              : 0}%
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Average Rating</h3>
          <p className="text-3xl font-bold mt-2 flex items-center gap-1">
            {averageRating} <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 inline" />
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Page Views Chart */}
        <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Page Views Over Time</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="currentColor" opacity={0.5} />
                <YAxis stroke="currentColor" opacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registration Stats Chart */}
        <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Registration Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="currentColor" opacity={0.5} />
                <YAxis stroke="currentColor" opacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Feedback Section */}
      <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm">
        <h3 className="text-xl font-semibold mb-6">Attendee Feedback ({feedback.length})</h3>
        {feedback.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No feedback submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {feedback.map(f => (
              <div key={f._id} className="p-4 border rounded-lg bg-muted">
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className={`w-4 h-4 ${star <= f.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                  ))}
                </div>
                {f.comment && <p className="text-sm text-gray-700">{f.comment}</p>}
                <p className="text-xs text-muted-foreground mt-2">{new Date(f.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

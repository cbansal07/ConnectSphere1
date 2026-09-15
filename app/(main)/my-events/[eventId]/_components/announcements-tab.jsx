
"use client";
import { useState } from "react";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AnnouncementsTab({ eventId }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const broadcastAnnouncement = useConvexMutation(api.emails.broadcastAnnouncement);

  const handleBroadcast = async () => {
    if (!subject || !message) {
      toast.error("Please provide both subject and message");
      return;
    }
    setLoading(true);
    try {
      await broadcastAnnouncement({ eventId, subject, message });
      toast.success("Announcement broadcasted successfully!");
      setSubject("");
      setMessage("");
    } catch (e) {
      toast.error("Failed to broadcast announcement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-white shadow-sm">
      <h3 className="text-xl font-semibold">Broadcast Announcement</h3>
      <p className="text-sm text-muted-foreground">Send an email to all confirmed attendees of this event.</p>
      
      <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
      <Textarea 
        placeholder="Type your message here..." 
        className="min-h-[150px]"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <Button onClick={handleBroadcast} disabled={loading} className="w-full">
        {loading ? "Sending..." : "Send to All Attendees"}
      </Button>
    </div>
  );
}

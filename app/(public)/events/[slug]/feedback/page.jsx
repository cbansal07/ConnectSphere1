
"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Star } from "lucide-react";

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { data: event, isLoading } = useConvexQuery(api.events.getEventBySlug, { slug: params.slug });
  const { mutate: submitFeedback } = useConvexMutation(api.events.submitFeedback);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!event) return <div className="text-center mt-20">Event not found.</div>;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please provide a rating");
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ eventId: event._id, rating, comment });
      setSubmitted(true);
    } catch (e) {
      toast.error("Failed to submit feedback. Have you already submitted?");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <Star className="w-8 h-8 fill-current" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Thank you!</h1>
        <p className="text-muted-foreground mb-8">Your feedback has been submitted successfully.</p>
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-2">How was {event.title}?</h1>
      <p className="text-muted-foreground mb-8">Please share your experience to help the organizer improve future events.</p>
      
      <div className="space-y-8 bg-white p-8 border rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-medium mb-4 text-center">Rate your experience</h2>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-hidden"
              >
                <Star
                  className={`w-12 h-12 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Additional comments (optional)</h2>
          <Textarea 
            placeholder="What did you like? What could be improved?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <Button 
          className="w-full h-12 text-lg" 
          onClick={handleSubmit} 
          disabled={submitting || rating === 0}
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
}


import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function generateMetadata({ params }) {
  try {
    const slug = params.slug;
    const event = await fetchQuery(api.events.getEventBySlug, { slug });

    if (!event) return { title: "Event Not Found" };

    return {
      title: `${event.title} | ConnectSphere`,
      description: event.description.slice(0, 160),
      openGraph: {
        title: event.title,
        description: event.description.slice(0, 160),
        images: event.coverImage ? [event.coverImage] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: event.title,
        description: event.description.slice(0, 160),
        images: event.coverImage ? [event.coverImage] : [],
      },
    };
  } catch (e) {
    return { title: "Event Details" };
  }
}

export default function EventLayout({ children }) {
  return children;
}

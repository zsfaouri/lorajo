import { AdminResourceManager, localeField, statusField } from "@/components/admin/admin-resource-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminEvents } from "@/lib/admin-data";

export default async function AdminEventsPage() {
  await requireAdmin();
  const items = await listAdminEvents();

  return (
    <AdminResourceManager
      title="Events"
      description="Create and publish events with location, schedule, summary, and structured content."
      endpoint="/api/admin/events"
      initialItems={items}
      fields={[
        localeField,
        { name: "title", label: "Title" },
        { name: "slug", label: "Slug" },
        { name: "summary", label: "Summary", type: "textarea" },
        { name: "location", label: "Location" },
        { name: "startsAt", label: "Starts at", type: "datetime" },
        { name: "endsAt", label: "Ends at", type: "datetime" },
        { name: "imageUrl", label: "Image URL", placeholder: "Paste an image URL from Media Library or another source." },
        { name: "imageAlt", label: "Image alt text" },
        { name: "actionLabel", label: "Action label", placeholder: "View details" },
        { name: "content", label: "Event details", type: "textarea", placeholder: "Write the event details here." },
        statusField,
      ]}
    />
  );
}

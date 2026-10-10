import { ConversationsView } from "@/components/views";
import { requireFeature } from "@/lib/guards";

// Dev-only: the dashboard renders on the client after the session check, so instant-navigation
// validation has no static content to inspect here.
export const instant = false;

export default async function ConversationsPage({ params }: PageProps<"/[shopId]">) {
  await requireFeature(params, "conversations");
  return <ConversationsView />;
}

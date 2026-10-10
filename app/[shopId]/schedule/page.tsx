import { ScheduleView } from "@/components/views";
import { requireFeature } from "@/lib/guards";

// Dev-only: the dashboard renders on the client after the session check, so instant-navigation
// validation has no static content to inspect here.
export const instant = false;

export default async function SchedulePage({ params }: PageProps<"/[shopId]/schedule">) {
  await requireFeature(params, "schedule");
  return <ScheduleView />;
}

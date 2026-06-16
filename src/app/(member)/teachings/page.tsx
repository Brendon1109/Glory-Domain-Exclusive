import { getUpcomingTeachings, getRecordedTeachings } from "@/lib/queries";
import { TeachingCard } from "@/components/teaching-card";
import { Tabs } from "@/components/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { Teaching } from "@/db/schema";

export default async function TeachingsPage() {
  const [upcoming, recorded] = await Promise.all([
    getUpcomingTeachings(),
    getRecordedTeachings(),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-stone-900">Teachings</h1>
      <Tabs
        tabs={[
          {
            label: `Upcoming${upcoming.length ? ` (${upcoming.length})` : ""}`,
            content: (
              <TeachingList
                items={upcoming}
                context="upcoming"
                empty="No upcoming teachings are scheduled yet."
              />
            ),
          },
          {
            label: "Library",
            content: (
              <TeachingList
                items={recorded}
                context="recorded"
                empty="No recorded teachings yet. They'll appear here after a session is posted."
              />
            ),
          },
        ]}
      />
    </div>
  );
}

function TeachingList({
  items,
  context,
  empty,
}: {
  items: Teaching[];
  context: "upcoming" | "recorded";
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-stone-500">{empty}</CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((t) => (
        <TeachingCard key={t.id} teaching={t} context={context} />
      ))}
    </div>
  );
}

import { getWorshipItems } from "@/lib/queries";
import { pickForDay } from "@/lib/daily";
import { WorshipCard } from "@/components/worship-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function WorshipPage() {
  const items = await getWorshipItems();
  const featured = pickForDay(items, new Date(), 1)[0] ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Praise &amp; Worship</h1>
        <p className="text-sm text-stone-500">
          A fresh worship pick every day, plus the full collection.
        </p>
      </div>

      {featured ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Today&apos;s pick
          </h2>
          <WorshipCard item={featured} />
        </section>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-stone-500">
            No worship has been added yet.
          </CardContent>
        </Card>
      ) : (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
            All worship
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((i) => (
              <WorshipCard key={i.id} item={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

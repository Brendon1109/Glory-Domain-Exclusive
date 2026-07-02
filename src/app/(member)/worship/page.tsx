import { getWorshipItems } from "@/lib/queries";
import { pickForWeek } from "@/lib/daily";
import { WorshipCard } from "@/components/worship-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function WorshipPage() {
  const items = await getWorshipItems();
  const weekly = pickForWeek(items, new Date(), Math.min(3, items.length));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Praise &amp; Worship
        </h1>
        <p className="mt-1 text-sm text-muted">
          A fresh selection each Sunday, plus the full collection.
        </p>
      </div>

      {weekly.length ? (
        <section>
          <h2 className="eyebrow mb-2.5">This week&apos;s picks</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {weekly.map((i) => (
              <WorshipCard key={i.id} item={i} />
            ))}
          </div>
        </section>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted">
            No worship has been added yet.
          </CardContent>
        </Card>
      ) : (
        <section>
          <h2 className="eyebrow mb-2.5">All worship</h2>
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

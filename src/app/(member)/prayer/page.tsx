import { getPrayerRequests } from "@/lib/queries";
import { PrayerForm } from "@/components/prayer/prayer-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LocalDateTime } from "@/components/local-datetime";

export default async function PrayerPage() {
  const requests = await getPrayerRequests();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Prayer wall
        </h1>
        <p className="mt-1 text-sm text-muted">
          Share a request — our pastor and church family will pray with you.
        </p>
      </div>

      <PrayerForm />

      <div className="space-y-3">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-muted">
              No prayer requests yet. Be the first to share.
            </CardContent>
          </Card>
        ) : (
          requests.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{r.name}</span>
                {r.status === "praying" ? (
                  <Badge tone="amber">Praying</Badge>
                ) : null}
                {r.status === "answered" ? (
                  <Badge tone="green">Answered</Badge>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink/90">{r.body}</p>
              <p className="mt-2 text-xs text-faint">
                <LocalDateTime iso={new Date(r.createdAt).toISOString()} />
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

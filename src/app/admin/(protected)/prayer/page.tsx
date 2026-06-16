import { getPrayerRequests } from "@/lib/queries";
import { PrayerAdmin } from "@/components/admin/prayer-admin";

export default async function AdminPrayerPage() {
  const requests = await getPrayerRequests();
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-stone-900">Prayer requests</h1>
      <PrayerAdmin requests={requests} />
    </div>
  );
}

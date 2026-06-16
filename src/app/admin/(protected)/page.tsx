import Link from "next/link";
import { CalendarPlus, Heart, Music, Settings, ArrowRight } from "lucide-react";
import {
  getUpcomingTeachings,
  getRecordedTeachings,
  getPrayerRequests,
  getWorshipItems,
} from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDashboard() {
  const [upcoming, recorded, prayers, worship] = await Promise.all([
    getUpcomingTeachings(),
    getRecordedTeachings(),
    getPrayerRequests(),
    getWorshipItems(),
  ]);
  const openPrayers = prayers.filter((p) => p.status !== "answered").length;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-stone-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Upcoming teachings" value={upcoming.length} />
        <Stat label="Recorded teachings" value={recorded.length} />
        <Stat label="Open prayer requests" value={openPrayers} />
        <Stat label="Worship items" value={worship.length} />
      </div>

      <div className="space-y-2">
        <AdminLink href="/admin/teachings" icon={CalendarPlus} label="Schedule a teaching or add a recording" />
        <AdminLink href="/admin/prayer" icon={Heart} label="Answer prayer requests" />
        <AdminLink href="/admin/worship" icon={Music} label="Manage praise & worship" />
        <AdminLink href="/admin/settings" icon={Settings} label="Passcode, WhatsApp links & daily verse" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-3xl font-bold text-indigo-700">{value}</p>
        <p className="text-xs text-stone-500">{label}</p>
      </CardContent>
    </Card>
  );
}

function AdminLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof CalendarPlus;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:bg-stone-50"
    >
      <Icon className="h-5 w-5 shrink-0 text-indigo-700" />
      <span className="flex-1 text-sm font-medium text-stone-800">{label}</span>
      <ArrowRight className="h-4 w-4 text-stone-400" />
    </Link>
  );
}

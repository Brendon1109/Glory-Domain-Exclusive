import { getWorshipItems } from "@/lib/queries";
import { WorshipAdmin } from "@/components/admin/worship-admin";
import { requireAdmin } from "@/lib/session";

export default async function AdminWorshipPage() {
  await requireAdmin();
  const items = await getWorshipItems();
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-stone-900">
        Praise &amp; Worship
      </h1>
      <WorshipAdmin items={items} />
    </div>
  );
}

import { getAllTeachings } from "@/lib/queries";
import { TeachingAdmin } from "@/components/admin/teaching-admin";
import { requireAdmin } from "@/lib/session";

export default async function AdminTeachingsPage() {
  await requireAdmin();
  const teachings = await getAllTeachings();
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-stone-900">Teachings</h1>
      <TeachingAdmin teachings={teachings} />
    </div>
  );
}

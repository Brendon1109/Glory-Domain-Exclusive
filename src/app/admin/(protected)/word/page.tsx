import { getDailyWords } from "@/lib/queries";
import { DailyWordAdmin } from "@/components/admin/daily-word-admin";

export default async function AdminWordPage() {
  const words = await getDailyWords(50);
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight text-ink">
        Daily Word
      </h1>
      <DailyWordAdmin words={words} />
    </div>
  );
}

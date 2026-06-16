import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-stone-900">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}

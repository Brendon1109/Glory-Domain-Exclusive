import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline — Glory Domain" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-200 text-stone-500">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-stone-900">You&apos;re offline</h1>
      <p className="mt-2 max-w-xs text-sm text-stone-500">
        Live teachings and prayer need a connection. Scripture you&apos;ve
        already opened is still available — reconnect to see the latest.
      </p>
    </main>
  );
}

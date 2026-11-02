import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline · VaaniStore" };

export default function OfflinePage() {
  return (
    <main className="bg-grain flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="bg-surface text-ink-soft shadow-soft ring-line flex h-16 w-16 items-center justify-center rounded-3xl ring-1">
        <WifiOff className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        You&apos;re offline · आप ऑफ़लाइन हैं
      </h1>
      <p className="text-ink-soft max-w-sm">
        Your draft is saved on this phone. Connect to the internet to continue.
        <br />
        आपका काम इस फ़ोन में सेव है। इंटरनेट चालू करके जारी रखें।
      </p>
    </main>
  );
}

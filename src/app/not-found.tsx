import { Store } from "lucide-react";
import Link from "next/link";
import { btn } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <main className="bg-grain flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="bg-surface text-kesar-500 shadow-soft ring-line flex h-16 w-16 items-center justify-center rounded-3xl ring-1">
        <Store className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Shop not found</h1>
      <p className="text-ink-soft max-w-sm">
        This shop link doesn&apos;t exist or isn&apos;t published yet.
        <br />
        यह दुकान का लिंक मौजूद नहीं है या अभी पब्लिश नहीं हुआ।
      </p>
      <Link href="/" className={`${btn.base} ${btn.md} ${btn.dark} mt-2`}>
        VaaniStore home
      </Link>
    </main>
  );
}

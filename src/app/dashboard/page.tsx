import type { Metadata } from "next";
import { DashboardLoader } from "@/components/dashboard/DashboardLoader";

export const metadata: Metadata = { title: "Dashboard · VaaniStore", robots: { index: false } };

export default function DashboardPage() {
  return <DashboardLoader />;
}

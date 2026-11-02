"use client";

import dynamic from "next/dynamic";

/**
 * The dashboard starts from browser-only state (localStorage draft, mic, auth session),
 * so rendering it on the server would only produce a mismatched first frame.
 */
const Dashboard = dynamic(() => import("./Dashboard").then((m) => m.Dashboard), {
  ssr: false,
  loading: () => <div className="bg-paper min-h-screen" />,
});

export function DashboardLoader() {
  return <Dashboard />;
}

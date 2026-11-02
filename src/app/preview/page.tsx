import type { Metadata } from "next";
import { PreviewSwitcher } from "./PreviewSwitcher";

export const metadata: Metadata = {
  title: "Preview · VaaniStore",
  robots: { index: false },
};

/** Demo of the storefront with sample data — lets you check all 3 themes without any setup. */
export default function PreviewPage() {
  return <PreviewSwitcher />;
}

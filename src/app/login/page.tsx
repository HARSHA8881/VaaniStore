import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in · VaaniStore", robots: { index: false } };

export default function LoginPage() {
  return <LoginForm />;
}

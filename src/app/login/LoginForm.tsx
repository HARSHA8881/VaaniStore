"use client";

import { ArrowRight, LoaderCircle, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UiLangToggle, useUi } from "@/components/UiLang";
import { Logo } from "@/components/ui/Logo";
import { btn, card, input } from "@/components/ui/styles";
import { getBrowserSupabase } from "@/lib/supabase/client";

/** Email magic link (no password to forget) or Google. */
export function LoginForm() {
  const { t } = useUi();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const supabase = getBrowserSupabase();
  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else setState("sent");
  }

  async function google() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    }
  }

  return (
    <div className="bg-grain flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
        <Link href="/" aria-label="VaaniStore home">
          <Logo />
        </Link>
        <UiLangToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-20">
        <div className={`${card} animate-rise p-7`}>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t("loginTitle")}</h1>

          {!supabase ? (
            <p className="mt-5 rounded-2xl bg-[#fff6e0] p-4 text-sm text-[#7a4b00]">
              Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.
            </p>
          ) : state === "sent" ? (
            <div role="status" className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
              <span className="bg-leaf-50 text-leaf flex h-14 w-14 items-center justify-center rounded-full">
                <MailCheck className="h-7 w-7" aria-hidden />
              </span>
              <p className="text-lg font-medium">{t("checkEmail")}</p>
              <p className="text-ink-soft text-sm">{email}</p>
            </div>
          ) : (
            <>
              <form onSubmit={sendLink} className="mt-6 space-y-3">
                <label className="block">
                  <span className="text-ink-soft mb-1.5 block text-sm font-medium">
                    {t("emailLabel")}
                  </span>
                  <span className="relative block">
                    <Mail
                      className="text-ink-faint pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
                      aria-hidden
                    />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`${input} min-h-13 pl-11`}
                    />
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className={`${btn.base} ${btn.lg} ${btn.primary} w-full`}
                >
                  {state === "sending" ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
                  ) : null}
                  {t("sendLink")}
                  {state !== "sending" && <ArrowRight className="h-4 w-4" aria-hidden />}
                </button>
              </form>

              <div className="text-ink-faint my-5 flex items-center gap-3 text-xs font-medium tracking-wider uppercase">
                <span className="bg-line h-px flex-1" />
                or
                <span className="bg-line h-px flex-1" />
              </div>

              <button
                type="button"
                onClick={google}
                className={`${btn.base} ${btn.lg} ${btn.outline} w-full`}
              >
                <GoogleG />
                {t("continueWithGoogle")}
              </button>

              {state === "error" && (
                <p
                  role="alert"
                  className="bg-danger-50 text-danger mt-4 rounded-2xl px-4 py-3 text-sm"
                >
                  {message}
                </p>
              )}
            </>
          )}
        </div>
        <p className="text-ink-faint mt-6 text-center text-xs">
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
        </p>
      </main>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z"
      />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z" />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z"
      />
    </svg>
  );
}

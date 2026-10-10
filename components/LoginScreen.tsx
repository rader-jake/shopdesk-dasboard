"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User } from "lucide-react";
import { BrandMark } from "@/components/Layout";
import { DEFAULT_THEME, findShopByCredentials, getShop } from "@/config/shops";
import { fontClassName } from "@/lib/fonts";
import { signIn, useSessionShopId } from "@/lib/session";
import { themeStyle } from "@/lib/theme";

/** Shared login. `/login?shop=<id>` themes it for that client; otherwise it's neutral ShopDesk. */
export function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const hintShop = getShop(params.get("shop"));
  const sessionShopId = useSessionShopId();
  const theme = hintShop?.theme ?? DEFAULT_THEME;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Already signed in? Skip the form.
  useEffect(() => {
    if (sessionShopId && getShop(sessionShopId)) router.replace(`/${sessionShopId}`);
  }, [sessionShopId, router]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const shop = findShopByCredentials(username, password);
    if (!shop) {
      setError("Incorrect username or password");
      setTimeout(() => setError(""), 3500);
      return;
    }
    signIn(shop.id);
    router.replace(`/${shop.id}`);
  };

  return (
    <div
      style={themeStyle(theme)}
      className={`${fontClassName(theme)} relative grid min-h-dvh place-items-center overflow-hidden bg-bg p-5 text-text`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_60%)]" />
      <form
        onSubmit={submit}
        className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-8 pt-10 shadow-2xl sm:p-10"
      >
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
        <div className="mb-8 flex items-center justify-center gap-3">
          <BrandMark name={hintShop?.name ?? "ShopDesk"} className="size-10 text-xl" />
          <div className="font-display text-xl tracking-wide">{hintShop?.name ?? "ShopDesk"}</div>
        </div>
        <h1 className="mb-1 text-center font-display text-3xl">Welcome back</h1>
        <p className="mb-7 text-center text-sm text-muted">
          {hintShop ? `Sign in to your ${hintShop.name} dashboard` : "Sign in to your dashboard"}
        </p>

        <label className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-text/5 px-4 transition focus-within:border-accent/50">
          <User className="size-4 text-muted" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            aria-label="Username"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            required
            className="w-full bg-transparent py-3.5 text-base outline-none placeholder:text-muted/60"
          />
        </label>
        <label className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-text/5 px-4 transition focus-within:border-accent/50">
          <Lock className="size-4 text-muted" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            required
            className="w-full bg-transparent py-3.5 text-base outline-none placeholder:text-muted/60"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-on-accent transition hover:brightness-110"
        >
          Sign in
        </button>
        <p role="alert" className="mt-3 min-h-5 text-center text-sm text-danger">
          {error}
        </p>
        <p className="mt-4 text-center text-[11px] tracking-wide text-muted/70">
          Powered by <span className="font-semibold">shopdesk.ai</span>
        </p>
      </form>
    </div>
  );
}

import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl tracking-tight text-text ${className}`}>
      ShopDesk
      <span className="ml-0.5 inline-block size-2 rounded-full bg-accent align-baseline ring-1 ring-text/10" aria-hidden />
    </span>
  );
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <Link href="/" className="rounded-md" aria-label="ShopDesk home">
          <Wordmark />
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-text"
        >
          Client Login
        </Link>
      </nav>
    </header>
  );
}

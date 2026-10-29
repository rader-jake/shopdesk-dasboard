import Image from "next/image";
import Link from "next/link";

/** The robot logo sits on a dark tile: its antenna and eyes are white, so it needs a dark backdrop. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl tracking-tight text-text ${className}`}>
      <span className="grid size-[1.7em] place-items-center rounded-[0.5em] bg-[#14140f]">
        <Image src="/brand/logo.png" alt="" width={512} height={398} className="h-auto w-[1.05em]" priority />
      </span>
      ShopDesk
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

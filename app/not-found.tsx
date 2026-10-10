import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-6 text-center">
      <div>
        <div className="font-display text-5xl text-accent">404</div>
        <p className="mt-2 text-muted">We couldn’t find that dashboard.</p>
        <Link href="/login" className="mt-6 inline-block rounded-lg border border-line px-4 py-2 text-sm text-text hover:border-line2">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}

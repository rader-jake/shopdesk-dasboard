import Link from "next/link";
import { DEMO_CONSENT_TEXT, MARKETING_CONSENT_TEXT } from "@/lib/marketing/consent";

interface Props {
  demo: boolean;
  marketing: boolean;
  onDemo: (checked: boolean) => void;
  onMarketing: (checked: boolean) => void;
}

const box = "mt-0.5 size-5 shrink-0 cursor-pointer accent-[#14140f]";
const label = "flex cursor-pointer items-start gap-3 text-left text-[13px] leading-relaxed text-muted";

/** The two SMS opt-ins. Both start unchecked; only the first is required (the parent gates its submit button on `demo`). */
export default function ConsentCheckboxes({ demo, marketing, onDemo, onMarketing }: Props) {
  return (
    <div className="mt-4 space-y-3.5">
      <label className={label}>
        <input type="checkbox" className={box} checked={demo} onChange={(e) => onDemo(e.target.checked)} />
        <span>
          <span className="font-semibold text-text">(Required for the demo)</span> {DEMO_CONSENT_TEXT}
        </span>
      </label>
      <label className={label}>
        <input type="checkbox" className={box} checked={marketing} onChange={(e) => onMarketing(e.target.checked)} />
        <span>
          <span className="font-semibold text-text">(Optional)</span> {MARKETING_CONSENT_TEXT}
        </span>
      </label>
      <p className="text-center text-[13px] text-muted">
        <Link href="/terms" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-text">
          Terms of Service
        </Link>
        {" · "}
        <Link href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-text">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

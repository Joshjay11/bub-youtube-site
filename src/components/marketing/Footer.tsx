import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border max-w-[1120px] mx-auto px-8 py-10 flex flex-col sm:flex-row justify-between items-center gap-4">
      <span className="text-[13px] text-text-muted">
        &copy; 2026 BUB YouTube Writer &middot; Part of the{" "}
        <a href="https://bubwriter.com" className="text-text-muted hover:text-text-dim">
          BUB
        </a>{" "}
        family
      </span>
      <div className="flex gap-6 flex-wrap justify-center">
        <Link href="/terms" className="text-[13px] text-text-muted hover:text-text-dim no-underline">
          Terms
        </Link>
        <Link href="/privacy" className="text-[13px] text-text-muted hover:text-text-dim no-underline">
          Privacy
        </Link>
        <Link href="/refund" className="text-[13px] text-text-muted hover:text-text-dim no-underline">
          Refund Policy
        </Link>
        <a
          href="https://bubwriter.com"
          className="text-[13px] text-text-muted hover:text-text-dim"
        >
          bubwriter.com
        </a>
        <a
          href="https://bubai.me"
          className="text-[13px] text-text-muted hover:text-text-dim"
        >
          bubai.me
        </a>
      </div>
    </footer>
  );
}

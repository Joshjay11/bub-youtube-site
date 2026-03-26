export default function Footer() {
  return (
    <footer className="border-t border-border max-w-[1120px] mx-auto px-8 py-10 flex justify-between items-center flex-wrap gap-4">
      <span className="text-[13px] text-text-muted">
        © 2026 BUB YouTube Writer · Part of the{" "}
        <a href="https://bubwriter.com" className="text-text-muted hover:text-text-dim">
          BUB
        </a>{" "}
        family
      </span>
      <div className="flex gap-6">
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

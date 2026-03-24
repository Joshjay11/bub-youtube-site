"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/process", label: "Process" },
  { href: "/pricing", label: "Pricing" },
  { href: "/work", label: "Work" },
  { href: "/template", label: "Template" },
  { href: "/start", label: "Start" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-100 transition-all duration-400 border-b ${
        scrolled
          ? "bg-[rgba(8,9,12,0.92)] backdrop-blur-[20px] backdrop-saturate-[1.4] border-border"
          : "border-transparent"
      }`}
    >
      <div className="max-w-[1120px] mx-auto px-8 flex items-center justify-between h-[72px]">
        <Link href="/" className="flex items-baseline gap-2.5 no-underline">
          <span className="font-sans font-extrabold text-xl text-text-bright tracking-[-0.03em]">
            BUB
          </span>
          <span className="font-sans font-medium text-[11px] text-amber uppercase tracking-[0.14em]">
            YouTube Writer
          </span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-text-dim p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md text-[13px] font-medium px-4 py-2 transition-all no-underline ${
                pathname === link.href
                  ? "bg-amber-glow text-amber font-semibold"
                  : "text-text-dim hover:text-text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/start"
            className="ml-3 inline-flex items-center gap-2 bg-amber text-bg px-[22px] py-2.5 rounded-md font-bold text-[13px] no-underline transition-all hover:bg-amber-bright hover:-translate-y-px"
          >
            Start a Project
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-bg-elevated border-t border-border px-8 py-4 flex flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`rounded-md text-sm font-medium px-4 py-3 no-underline ${
                pathname === link.href
                  ? "bg-amber-glow text-amber"
                  : "text-text-dim"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

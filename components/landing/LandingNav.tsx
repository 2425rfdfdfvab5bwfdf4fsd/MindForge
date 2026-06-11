"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[#2A2927] bg-[#0A0908]/96 backdrop-blur-md shadow-[0_1px_12px_rgba(0,0,0,0.5)]"
          : "border-b border-[#2A2927] bg-[#0A0908]"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl 2xl:max-w-9xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-tight text-forge-orange hover:opacity-90 transition-opacity duration-200"
          aria-label="MindForge home"
        >
          MINDFORGE
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#pricing"
            className="text-sm text-[#87857F] hover:text-white transition-colors duration-200"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-[#87857F] hover:text-white transition-colors duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center bg-forge-orange px-5 text-sm font-bold text-white hover:bg-forge-orange-hover transition-colors duration-200"
          >
            Start Free →
          </Link>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-white"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            {open ? (
              <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="square" strokeLinejoin="miter" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="border-t border-[#2A2927] bg-[#0A0908] px-4 py-4 flex flex-col gap-1">
          <Link
            href="#pricing"
            onClick={() => setOpen(false)}
            className="flex min-h-[48px] items-center px-2 text-sm font-medium text-[#A09FA0] hover:text-white transition-colors duration-200 border-b border-[#1A1918]"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex min-h-[48px] items-center px-2 text-sm font-medium text-[#A09FA0] hover:text-white transition-colors duration-200 border-b border-[#1A1918]"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-3 flex min-h-[52px] items-center justify-center bg-forge-orange text-sm font-bold text-white hover:bg-forge-orange-hover transition-colors duration-200"
          >
            Start Forging — It's Free →
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/70 border-b border-border/30 shadow-sm shadow-primary/5"
          : "bg-background/50 border-b border-transparent"
      } backdrop-blur-xl`}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/minikyu.webp"
            alt="Minikyu"
            width={32}
            height={32}
            className="transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-0.5"
          />
          <span className="font-bold text-base sm:text-lg tracking-tight">
            Mini<span className="text-primary">kyu</span>
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <Link
            href="/"
            className={`relative text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/"
                ? "text-foreground bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Image
            {pathname === "/" && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>
          <Link
            href="/pdf"
            className={`relative text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/pdf"
                ? "text-foreground bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            PDF
            {pathname === "/pdf" && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>
          <Link
            href="/about"
            className={`relative text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/about"
                ? "text-foreground bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            About
            {pathname === "/about" && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

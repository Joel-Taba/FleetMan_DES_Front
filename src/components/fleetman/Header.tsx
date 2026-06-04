"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#accueil", label: "Accueil" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-50 px-4">
        <div className="mx-auto flex max-w-5xl items-center gap-2 rounded-full border border-white/50 bg-white/70 p-2 pl-4 shadow-xl backdrop-blur-md">
          <Logo showTagline={false} href="/" />

          <nav className="mx-auto hidden items-center gap-1 rounded-full bg-white/40 px-1.5 py-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-primary hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="authWhite" size="sm" asChild>
              <Link href="/login">
                Connexion
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="authWhite" size="sm" asChild>
              <Link href="/signup">
                Inscription
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <button
            type="button"
            className="ml-auto rounded-full p-2 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-fleet-dark/95 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <nav className="flex flex-col items-center justify-center gap-6 pt-24">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xl font-medium text-white"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Button variant="authWhite" size="lg" asChild>
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              Connexion
            </Link>
          </Button>
          <Button variant="authWhite" size="lg" asChild>
            <Link href="/signup" onClick={() => setMobileOpen(false)}>
              Inscription
            </Link>
          </Button>
        </nav>
      </div>
    </>
  );
}

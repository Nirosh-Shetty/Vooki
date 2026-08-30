"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

interface CreatorNavbarProps {
  className?: string;
}

export function CreatorNavbar({ className = "" }: CreatorNavbarProps) {
  const { user, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleScroll = () => {
        setScrolled(window.scrollY > 20);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const isBrand = user?.role === "brand";
  const isInfluencer = user?.role === "influencer";
  const isManager = user?.role === "manager";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between transition-all duration-300 ${
        scrolled
          ? "bg-[color:var(--vooki-home-nav)] backdrop-blur-md border-b border-[color:var(--vooki-home-border-soft)] shadow-xs"
          : "bg-transparent border-b border-transparent"
      } ${className}`}
    >
      {/* ─── LEFT: VOOKI LOGO ─── */}
      <Link
        href={
          isInfluencer
            ? "/influencer/dashboard"
            : isBrand
            ? "/brand/dashboard"
            : isManager
            ? "/manager/dashboard"
            : "/"
        }
        className="flex items-center gap-2.5 text-decoration-none group"
      >
        <img
          src="/images/company_logo/Vooki_logo_bgRemovedSvg.svg"
          alt="Vooki Logo"
          className="h-8 w-auto transition-transform duration-200 group-hover:scale-105"
        />
        <span className="text-lg font-bold tracking-tight text-[color:var(--vooki-home-text)]">
          vooki
        </span>
      </Link>

      {/* ─── RIGHT: ACTIONS ACCORDING TO AUTH STATE ─── */}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="w-20 h-9 rounded-xl bg-[color:var(--vooki-app-surface-strong)] animate-pulse" />
        ) : isInfluencer ? (
          /* Influencer: vooki logo ---- dashboard */
          <Link
            href="/influencer/dashboard"
            className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:opacity-90 transition-opacity shadow-xs"
          >
            Dashboard
          </Link>
        ) : isBrand ? (
          /* Brand: vooki logo ---- workspace */
          <Link
            href="/brand/dashboard"
            className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:opacity-90 transition-opacity shadow-xs"
          >
            Workspace
          </Link>
        ) : isManager ? (
          /* Manager: vooki logo ---- dashboard */
          <Link
            href="/manager/dashboard"
            className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:opacity-90 transition-opacity shadow-xs"
          >
            Dashboard
          </Link>
        ) : (
          /* Public: vooki logo ---- login, get started */
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-xs sm:text-sm font-semibold text-[color:var(--vooki-home-text-muted)] hover:text-[color:var(--vooki-home-text)] transition-colors px-2 py-1.5"
            >
              Log in
            </Link>
            <Link
              href="/signin"
              className="text-xs sm:text-sm font-semibold text-[color:var(--vooki-accent-text)] bg-[color:var(--vooki-accent)] hover:opacity-90 px-4 py-2 rounded-xl transition-all shadow-xs"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

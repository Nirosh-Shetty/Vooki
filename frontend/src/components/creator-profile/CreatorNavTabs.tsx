"use client";

import React from "react";
import { BarChart3, Handshake, Layers, LayoutGrid } from "lucide-react";
import { SectionTab } from "./types";

interface CreatorNavTabsProps {
  activeSection: SectionTab;
  onSectionChange: (section: SectionTab) => void;
  connectedPlatformsCount?: number;
  featuredCount?: number;
  collabsCount?: number;
  className?: string;
}

export function CreatorNavTabs({
  activeSection,
  onSectionChange,
  connectedPlatformsCount = 0,
  featuredCount = 0,
  collabsCount = 0,
  className = "",
}: CreatorNavTabsProps) {
  return (
    <nav
      aria-label="Media Kit Sections"
      className={`flex items-center gap-1.5 p-1 rounded-2xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] shadow-xs overflow-x-auto no-scrollbar ${className}`}
    >
      <button
        type="button"
        onClick={() => onSectionChange("overview")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
          activeSection === "overview"
            ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shadow-xs"
            : "text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>About</span>
      </button>

      <button
        type="button"
        onClick={() => onSectionChange("analytics")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
          activeSection === "analytics"
            ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shadow-xs"
            : "text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        <span>Connected Social Media</span>
        {connectedPlatformsCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)]">
            {connectedPlatformsCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onSectionChange("portfolio")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
          activeSection === "portfolio"
            ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shadow-xs"
            : "text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
        }`}
      >
        <Layers className="w-4 h-4" />
        <span>Featured Media</span>
        {featuredCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)]">
            {featuredCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onSectionChange("partnerships")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
          activeSection === "partnerships"
            ? "bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shadow-xs"
            : "text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
        }`}
      >
        <Handshake className="w-4 h-4" />
        <span>Collabs & Reviews</span>
        {collabsCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)]">
            {collabsCount}
          </span>
        )}
      </button>
    </nav>
  );
}


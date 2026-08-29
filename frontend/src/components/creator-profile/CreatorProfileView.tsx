"use client";

import React, { useState, useEffect, useMemo } from "react";
import Script from "next/script";
import {
  CreatorProfileViewProps,
  PublicProfileData,
  SectionTab,
} from "./types";
import { CreatorNavbar } from "./CreatorNavbar";
import { CreatorHeader } from "./CreatorHeader";
import { CreatorNavTabs } from "./CreatorNavTabs";
import { CreatorOverviewTab } from "./CreatorOverviewTab";
import { CreatorAnalyticsTab } from "./CreatorAnalyticsTab";
import { CreatorPortfolioTab } from "./CreatorPortfolioTab";
import { CreatorCollabsTab } from "./CreatorCollabsTab";
import { CreatorInquiryModal } from "./CreatorInquiryModal";

export function CreatorProfileView({
  creatorId,
  initialData = null,
  viewMode = "public",
  showNavbar,
  customActions,
  campaigns = [],
  onInviteSuccess,
  onBack,
  className = "",
}: CreatorProfileViewProps) {
  const [data, setData] = useState<PublicProfileData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData && Boolean(creatorId));
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionTab>("overview");
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const shouldShowNavbar = showNavbar !== undefined ? showNavbar : viewMode === "public";


  // Fetch profile if creatorId is given and initialData was not
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    if (!creatorId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(
          `${backendUrl}/api/public/profile/${encodeURIComponent(creatorId)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          setData(null);
          setError("Creator profile not found");
          return;
        }

        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setData(null);
          setError(json.message || "Failed to load profile");
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to load creator profile:", err);
        setData(null);
        setError("Unable to load profile at this time");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, [creatorId, initialData]);

  // Reprocess Instagram embeds on tab or data change
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    }
  }, [data, activeSection]);

  const activePlatformsCount = useMemo(() => {
    if (!data?.profile?.stats) return 0;
    const stats = data.profile.stats;
    let count = 0;
    if (stats.youtube) count++;
    if (stats.instagram) count++;
    if (stats.facebook) count++;
    if (stats.twitter) count++;
    return count;
  }, [data]);

  const featuredCount = data?.profile?.featuredContent?.length || 0;
  const collabsCount =
    data?.profile?.collaborations?.length || data?.profile?.reviews?.length || 0;

  if (loading) {
    return (
      <div className="min-h-[500px] bg-[color:var(--vooki-app-bg)] flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[color:var(--vooki-app-active-border)] border-t-[color:var(--vooki-app-active-text)] animate-spin" />
          <span className="text-xs text-[color:var(--vooki-app-text-muted)] tracking-wider uppercase font-semibold">
            Loading Media Kit...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-[color:var(--vooki-app-bg)]">
        <div className="rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-8 max-w-md w-full shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">
            {error || "Creator Not Found"}
          </h2>
          <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
            The requested creator profile could not be loaded or may not exist.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const hasInstagram = data.profile?.featuredContent?.some((i) =>
    i.url.includes("instagram.com")
  );

  return (
    <div
      className={`min-h-screen bg-[color:var(--vooki-app-bg)] text-[color:var(--vooki-app-text)] font-sans selection:bg-[color:var(--vooki-app-active-bg)] ${className}`}
    >
      {hasInstagram && (
        <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />
      )}

      {/* ================= FIXED TOP NAVBAR ================= */}
      {shouldShowNavbar && <CreatorNavbar />}

      {/* ================= MAIN PROFILE CONTENT ================= */}
      <main
        className={`px-4 sm:px-6 lg:px-8 ${
          shouldShowNavbar ? "pt-20 sm:pt-24 pb-12" : "py-6 sm:py-8"
        }`}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          {/* Hero Header */}
          <CreatorHeader
            data={data}
            viewMode={viewMode}
            onOpenInquiry={() => setIsInquiryOpen(true)}
            customActions={customActions}
            campaigns={campaigns}
            onInviteSuccess={onInviteSuccess}
            onBack={onBack}
          />

          {/* Navigation Section Tabs */}
          <CreatorNavTabs
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            connectedPlatformsCount={activePlatformsCount}
            featuredCount={featuredCount}
            collabsCount={collabsCount}
          />

          {/* Tab Views */}
          {activeSection === "overview" && <CreatorOverviewTab data={data} />}
          {activeSection === "analytics" && <CreatorAnalyticsTab data={data} />}
          {activeSection === "portfolio" && <CreatorPortfolioTab data={data} />}
          {activeSection === "partnerships" && <CreatorCollabsTab data={data} />}
        </div>

        {/* Inquiry Modal */}
        <CreatorInquiryModal
          data={data}
          isOpen={isInquiryOpen}
          onClose={() => setIsInquiryOpen(false)}
        />
      </main>
    </div>
  );
}


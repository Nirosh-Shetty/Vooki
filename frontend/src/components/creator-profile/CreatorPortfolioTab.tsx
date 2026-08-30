"use client";

import React from "react";
import { Play } from "lucide-react";
import { PublicProfileData } from "./types";
import { SocialEmbedPlayer } from "./SocialEmbedPlayer";

interface CreatorPortfolioTabProps {
  data: PublicProfileData;
  className?: string;
}

export function CreatorPortfolioTab({ data, className = "" }: CreatorPortfolioTabProps) {
  const { profile } = data;
  const featuredContent = profile?.featuredContent || [];

  return (
    <section
      className={`animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs ${className}`}
    >
      {featuredContent.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {featuredContent.map((item, idx) => (
            <div
              key={item._id || idx}
              className="group relative rounded-2xl overflow-hidden border border-[color:var(--vooki-app-border-strong)] bg-black h-[540px] flex flex-col shadow-xs transition-all hover:border-[color:var(--vooki-app-active-border)]"
            >
              <SocialEmbedPlayer url={item.url} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-10 text-center space-y-2">
          <Play className="w-8 h-8 mx-auto text-[color:var(--vooki-app-text-muted)]" />
          <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
            Portfolio Being Curated
          </p>
          <p className="text-xs text-[color:var(--vooki-app-text-muted)] max-w-sm mx-auto">
            The creator hasn't linked sample media deliverables yet. Check back soon for updated
            featured reels.
          </p>
        </div>
      )}
    </section>
  );
}


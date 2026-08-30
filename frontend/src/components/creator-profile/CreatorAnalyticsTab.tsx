"use client";

import React from "react";
import { CheckCircle2, Facebook, Instagram, Youtube } from "lucide-react";
import { PublicProfileData } from "./types";

interface CreatorAnalyticsTabProps {
  data: PublicProfileData;
  className?: string;
}

export function CreatorAnalyticsTab({ data, className = "" }: CreatorAnalyticsTabProps) {
  const { profile } = data;

  const platforms = [
    {
      key: "youtube",
      name: "YouTube",
      icon: Youtube,
      iconBg: "bg-[#FEF0F0] text-[#FF0000] dark:bg-red-950/40 dark:text-red-400",
      data: profile?.stats?.youtube,
      metricLabel: "SUBSCRIBERS",
    },
    {
      key: "instagram",
      name: "Instagram",
      icon: Instagram,
      iconBg: "bg-[#FDF0F5] text-[#E1306C] dark:bg-pink-950/40 dark:text-pink-400",
      data: profile?.stats?.instagram,
      metricLabel: "FOLLOWERS",
    },
    {
      key: "facebook",
      name: "Facebook",
      icon: Facebook,
      iconBg: "bg-[#EFF4FE] text-[#1877F2] dark:bg-blue-950/40 dark:text-blue-400",
      data: profile?.stats?.facebook,
      metricLabel: "FOLLOWERS",
    },
    {
      key: "twitter",
      name: "X (Twitter)",
      customIcon: () => (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      iconBg: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
      data: profile?.stats?.twitter,
      metricLabel: "FOLLOWERS",
    },
  ];

  return (
    <section
      className={`animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {platforms.map((platform) => {
          const isConnected = Boolean(platform.data);
          const metrics = platform.data?.metrics;
          const Icon = platform.icon;
          const CustomIcon = platform.customIcon;

          const primaryCount =
            metrics?.subscribers !== undefined
              ? metrics.subscribers
              : metrics?.followers !== undefined
              ? metrics.followers
              : undefined;

          return (
            <div
              key={platform.key}
              className="rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 flex flex-col justify-between shadow-xs transition-all hover:border-[color:var(--vooki-app-active-border)] min-h-[270px]"
            >
              {/* Top Row: Icon + Status Badge */}
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${platform.iconBg}`}
                >
                  {CustomIcon ? <CustomIcon /> : Icon && <Icon className="w-5 h-5" />}
                </div>

                {isConnected ? (
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#E8F8F0] text-[#10B981] border border-[#10B981]/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Connected
                  </span>
                ) : (
                  <span className="text-xs text-[color:var(--vooki-app-text-muted)] font-normal">
                    Not Connected
                  </span>
                )}
              </div>

              {/* Middle Section: Name + Primary Metric */}
              <div className="mt-6 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-[color:var(--vooki-app-text-strong)]">
                    {platform.name}
                  </span>
                  {isConnected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>

                <p className="text-3xl font-extrabold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  {isConnected && primaryCount !== undefined
                    ? primaryCount.toLocaleString()
                    : "-"}
                </p>

                <p className="text-[10px] font-bold tracking-wider uppercase text-[color:var(--vooki-app-text-muted)]">
                  {platform.metricLabel}
                </p>
              </div>

              {/* Bottom Row: Detailed Metrics OR Unconnected State */}
              <div className="mt-6 pt-4 border-t border-[color:var(--vooki-app-border-strong)]">
                {isConnected ? (
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                        {metrics?.totalViews !== undefined
                          ? metrics.totalViews.toLocaleString()
                          : 0}
                      </p>
                      <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                        Views
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                        {metrics?.videoCount !== undefined
                          ? metrics.videoCount.toLocaleString()
                          : 0}
                      </p>
                      <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                        Posts
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
                        {metrics?.likes !== undefined ? metrics.likes.toLocaleString() : 0}
                      </p>
                      <span className="text-[10px] text-[color:var(--vooki-app-text-muted)]">
                        Likes
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-xs text-[color:var(--vooki-app-text-muted)] py-1">
                    Not connected yet
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


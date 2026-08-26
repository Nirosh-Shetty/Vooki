"use client";

import { Sparkles, Users, Globe, MapPin } from "lucide-react";

interface AboutCardProps {
  summary?: string;
  highlight?: string;
  audience?: string;
  languages?: string[];
  location?: string;
}

export function AboutCard({
  summary,
  highlight,
  audience,
  languages,
  location,
}: AboutCardProps) {
  const hasAudienceData = Boolean(audience);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Creator Bio / Summary if present */}
      {summary && (
        <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-5 space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)]">
            About
          </span>
          <p className="text-xs sm:text-sm font-medium text-[color:var(--vooki-app-text-strong)] leading-relaxed">
            {summary}
          </p>
        </div>
      )}

      {/* Highlight Banner */}
      {highlight && (
        <div className="rounded-2xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)]/25 p-5 flex items-start gap-4">
          <div className="h-8 w-8 rounded-xl bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)]">
              Highlight
            </span>
            <p className="text-xs sm:text-sm font-medium text-[color:var(--vooki-app-text-strong)] leading-relaxed">
              {highlight}
            </p>
          </div>
        </div>
      )}

      {/* Side-by-Side: Audience (with Gender Ratio) & Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Dynamic Audience Breakdown Card */}
        <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-5 sm:p-6 flex flex-col justify-between min-h-[260px] shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[color:var(--vooki-app-text-strong)]">
              Audience
            </span>
            {hasAudienceData ? (
              <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-[#E8F8F0] text-[#10B981] border border-[#10B981]/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                Verified Data
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-muted)] border border-[color:var(--vooki-app-border-strong)]">
                Not Available
              </span>
            )}
          </div>

          {hasAudienceData ? (
            <div className="space-y-5 pt-3">
              {/* Gender Ratio Bar */}
              <div className="space-y-2">
                <span className="text-sm font-bold text-[color:var(--vooki-app-text-strong)]">
                  Gender Split
                </span>

                <div className="h-3 w-full rounded-full overflow-hidden flex bg-zinc-200 dark:bg-zinc-800">
                  <div
                    style={{ width: "85%" }}
                    className="bg-[#FF2E93] h-full rounded-l-full"
                  />
                  <div
                    style={{ width: "15%" }}
                    className="bg-[#2E7CF6] h-full rounded-r-full"
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-black pt-0.5">
                  <span className="text-[#FF2E93]">85% F</span>
                  <span className="text-[#2E7CF6]">15% M</span>
                </div>
              </div>

              {/* Age & Location Breakdown */}
              <div className="space-y-3 pt-3 border-t border-[color:var(--vooki-app-border-strong)]/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                    Top Age Bracket
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-[color:var(--vooki-app-text-strong)]">
                    18–24
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                    Top Location
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-[color:var(--vooki-app-text-strong)] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[color:var(--vooki-app-text-muted)]" />
                    <span>{location || "Not specified"}</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] flex items-center justify-center text-[color:var(--vooki-app-text-muted)]">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[color:var(--vooki-app-text-strong)]">
                Demographics Not Available
              </p>
              <p className="text-xs text-[color:var(--vooki-app-text-muted)] max-w-xs leading-relaxed">
                Audience age, gender split, and geography insights have not been synced
                for this profile.
              </p>
            </div>
          )}
        </div>

        {/* Languages Card */}
        <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[color:var(--vooki-app-text-strong)]">
              <Globe className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
              <span>Languages</span>
            </div>
            <p className="text-xs text-[color:var(--vooki-app-text-muted)] mt-1">
              Primary languages spoken for content creation and brand deliverables.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {languages && languages.length > 0 ? (
              languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] shadow-xs"
                >
                  {lang.trim()}
                </span>
              ))
            ) : (
              <span className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] shadow-xs">
                English
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-[color:var(--vooki-app-border-strong)]/60 text-[11px] text-[color:var(--vooki-app-text-muted)]" />
        </div>
      </div>
    </section>
  );
}
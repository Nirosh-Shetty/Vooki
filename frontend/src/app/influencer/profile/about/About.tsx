"use client";

import { Sparkles, Users, Globe, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AboutCardProps {
  summary?: string;
  highlight?: string;
  audience?: string;
  languages?: string[];
}

export function AboutCard({ summary, highlight, audience, languages }: AboutCardProps) {
  return (
    <Card className="rounded-2xl sm:rounded-3xl border-[color:var(--vooki-app-border)] shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg">About You</CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-4">
        {/* Creator Highlight Banner */}
        {highlight && (
          <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)]/20 p-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-subtle)]">
                Key Highlight
              </p>
              <p className="text-xs sm:text-sm font-medium text-[color:var(--vooki-app-text-strong)] leading-relaxed">
                {highlight}
              </p>
            </div>
          </div>
        )}


        {/* Audience & Languages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Audience */}
          <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--vooki-app-text-soft)] mb-2">
              <Users className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
              Audience Demographics
            </div>
            {audience ? (
              <p className="text-xs sm:text-sm text-[color:var(--vooki-app-text-strong)] leading-relaxed">
                {audience}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-[color:var(--vooki-app-text-soft)] italic">
                No audience details provided.
              </p>
            )}
          </div>

          {/* Languages */}
          <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--vooki-app-text-soft)] mb-2">
              <Globe className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
              Languages
            </div>
            {languages && languages.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {languages.map((lang, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs font-normal bg-background/50 border-[color:var(--vooki-app-border-strong)]"
                  >
                    {lang.trim()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-[color:var(--vooki-app-text-soft)] italic">
                No languages specified.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
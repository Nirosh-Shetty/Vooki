"use client";

import { Building2, Calendar, Megaphone, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type CollabHistory = {
  id: string;
  brand: string;
  campaign: string;
  date: string;
};

interface CollaborationsCardProps {
  collaborations: CollabHistory[];
}

export function CollaborationsCard({ collaborations }: CollaborationsCardProps) {
  return (
    <Card className="rounded-2xl sm:rounded-3xl border-[color:var(--vooki-app-border)] shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[color:var(--vooki-app-active-icon)]" />
          Previous Collaborations
        </CardTitle>
        {collaborations.length > 0 && (
          <Badge
            variant="outline"
            className="text-xs font-semibold bg-background/50 border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-soft)]"
          >
            {collaborations.length} {collaborations.length === 1 ? "Brand" : "Brands"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3">
        {collaborations.length > 0 ? (
          <div className="space-y-3">
            {collaborations.map((collab) => (
              <div
                key={collab.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3.5 sm:p-4 hover:border-[color:var(--vooki-app-active-border)] transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] shrink-0 mt-0.5">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs sm:text-sm text-[color:var(--vooki-app-text-strong)] truncate">
                        {collab.brand}
                      </h4>
                      <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-[11px] sm:text-xs text-[color:var(--vooki-app-text-soft)] mt-0.5 line-clamp-1">
                      {collab.campaign}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[color:var(--vooki-app-text-subtle)] shrink-0 self-end sm:self-center pl-11 sm:pl-0">
                  <Calendar className="h-3.5 w-3.5 text-[color:var(--vooki-app-text-soft)]" />
                  {collab.date}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-6 text-center">
            <p className="text-xs sm:text-sm text-[color:var(--vooki-app-text-soft)] italic">
              No collaboration history available.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import React, { useMemo } from "react";
import { Calendar, CheckCircle2, Megaphone } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { StarRating } from "./StarRating";
import { PublicProfileData } from "./types";

interface CreatorCollabsTabProps {
  data: PublicProfileData;
  className?: string;
}

export function CreatorCollabsTab({ data, className = "" }: CreatorCollabsTabProps) {
  const { profile } = data;

  // Aggregate ratings
  const { averageRating, reviewCount } = useMemo(() => {
    if (!profile?.reviews || profile.reviews.length === 0) {
      return {
        averageRating: data.rating && data.rating > 0 ? data.rating : null,
        reviewCount: data.totalReviews || 0,
      };
    }

    const validReviews = profile.reviews.filter((r) => {
      const val = r.score ?? r.rating;
      return typeof val === "number" && !isNaN(val) && val > 0;
    });

    if (validReviews.length === 0) {
      return {
        averageRating: data.rating && data.rating > 0 ? data.rating : null,
        reviewCount: profile.reviews.length,
      };
    }

    const sum = validReviews.reduce((acc, curr) => acc + (curr.score ?? curr.rating ?? 0), 0);
    const avg = Number((sum / validReviews.length).toFixed(1));

    return { averageRating: avg, reviewCount: validReviews.length };
  }, [data, profile?.reviews]);

  // Unified Brand Collabs & Testimonials
  const unifiedProof = useMemo(() => {
    const collabs = profile?.collaborations || [];
    const reviews = profile?.reviews || [];

    if (collabs.length === 0 && reviews.length > 0) {
      // If we have reviews without matching collabs
      return reviews.map((rev) => ({
        brandName: rev.brandName,
        isVerified: true,
        campaignTitle: "Brand Collaboration",
        date: rev.date,
        rating: rev.score ?? rev.rating,
        reviewText: rev.review?.trim() || "",
      }));
    }

    return collabs.map((collab, index) => {
      const matchedReview =
        reviews[index] ||
        reviews.find((r) => r.brandName === collab.brandName && r.date === collab.date);

      const scoreValue = Number(matchedReview?.score ?? matchedReview?.rating ?? 0);

      return {
        brandName: collab.brandName,
        isVerified: collab.isVerified !== undefined ? collab.isVerified : true,
        campaignTitle: collab.campaignTitle,
        date: collab.date,
        rating: scoreValue > 0 ? Math.round(scoreValue) : undefined,
        reviewText: matchedReview?.review?.trim() || "",
      };
    });
  }, [profile?.collaborations, profile?.reviews]);

  return (
    <section
      className={`animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--vooki-app-text-strong)]">
            Campaign History & Feedback
          </h2>
          <p className="text-xs text-[color:var(--vooki-app-text-muted)] mt-0.5">
            Verified brand collaborations and client reviews.
          </p>
        </div>

        {averageRating !== null && (
          <div className="flex items-center gap-2 text-[color:var(--vooki-app-text-strong)] shrink-0">
            <span className="text-lg sm:text-xl font-bold tracking-tight">
              {Number(averageRating).toFixed(1)}
            </span>

            <StarRating rating={Number(averageRating)} size="w-4 h-4" />

            {reviewCount > 0 && (
              <span className="text-sm font-normal text-[color:var(--vooki-app-text-muted)]">
                ({reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {unifiedProof.length === 0 ? (
        <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-10 text-center space-y-2">
          <Megaphone className="w-8 h-8 mx-auto text-[color:var(--vooki-app-text-muted)]" />
          <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
            Open for Collaborations
          </p>
          <p className="text-xs text-[color:var(--vooki-app-text-muted)] max-w-sm mx-auto">
            {data.name} is available for brand integrations, sponsored deliverables, and long-term
            partnerships.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unifiedProof.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-5 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[color:var(--vooki-app-surface)] border border-[color:var(--vooki-app-border)] flex items-center justify-center font-bold text-xs text-[color:var(--vooki-app-text-strong)] shrink-0">
                    {getInitials(item.brandName, "BR")}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[color:var(--vooki-app-text-strong)]">
                        {item.brandName}
                      </span>
                      {item.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-[color:var(--vooki-app-text-muted)] font-medium">
                      {item.campaignTitle}
                    </p>
                  </div>
                </div>

                {item.rating !== undefined && (
                  <StarRating rating={Number(item.rating)} size="w-3.5 h-3.5" />
                )}
              </div>

              {item.reviewText ? (
                <blockquote className="text-xs text-[color:var(--vooki-app-text-soft)] italic pl-3 border-l-2 border-[color:var(--vooki-app-active-border)]">
                  &ldquo;{item.reviewText}&rdquo;
                </blockquote>
              ) : (
                <div className="text-[11px] text-[color:var(--vooki-app-text-muted)] italic pl-3 border-l-2 border-[color:var(--vooki-app-border-strong)]">
                  Campaign verified and completed successfully.
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-[color:var(--vooki-app-text-muted)] pt-2 border-t border-[color:var(--vooki-app-border-strong)]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.date ? (
                    new Date(item.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  ) : (
                    "Recent"
                  )}
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Verified Deal
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


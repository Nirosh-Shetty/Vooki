"use client";

import { useMemo } from "react";
import { Calendar, CheckCircle2, Megaphone, Star } from "lucide-react";

export type CollabItem = {
  brandName: string;
  isVerified?: boolean;
  campaignTitle: string;
  date: string;
};

export type ReviewItem = {
  brandName?: string;
  author?: string;
  rating?: number;
  score?: number;
  review?: string;
  text?: string;
  date?: string;
};

interface CollaborationsCardProps {
  collaborations?: CollabItem[];
  reviews?: ReviewItem[];
  creatorName?: string;
}

export function StarRating({
  rating = 0,
  max = 5,
  size = "w-4 h-4",
}: {
  rating: number;
  max?: number;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, index) => {
        const fillPercentage = Math.max(0, Math.min(100, (rating - index) * 100));

        return (
          <div key={index} className={`relative ${size} shrink-0`}>
            <Star
              className={`${size} fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700 absolute top-0 left-0`}
            />

            {fillPercentage > 0 && (
              <div
                className="absolute top-0 left-0 overflow-hidden h-full"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star className={`${size} fill-amber-400 text-amber-400 max-w-none`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CollaborationsCard({
  collaborations = [],
  reviews = [],
  creatorName = "You",
}: CollaborationsCardProps) {
  // Aggregate ratings exactly as in creator/[username]/page.tsx
  const { averageRating, reviewCount } = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { averageRating: null, reviewCount: 0 };
    }

    const validReviews = reviews.filter((r) => {
      const val = r.score ?? r.rating;
      return typeof val === "number" && !isNaN(val) && val > 0;
    });

    if (validReviews.length === 0) {
      return { averageRating: null, reviewCount: reviews.length };
    }

    const sum = validReviews.reduce((acc, curr) => acc + (curr.score ?? curr.rating ?? 0), 0);
    const avg = Number((sum / validReviews.length).toFixed(1));

    return { averageRating: avg, reviewCount: validReviews.length };
  }, [reviews]);

  // Unified Brand Collabs & Testimonials exactly as in creator/[username]/page.tsx
  const unifiedProof = useMemo(() => {
    const collabs = collaborations || [];
    const revs = reviews || [];

    return collabs.map((collab, index) => {
      const matchedReview =
        revs[index] ||
        revs.find(
          (r) =>
            (r.brandName === collab.brandName || r.author === collab.brandName) &&
            r.date === collab.date
        );

      const scoreValue = Number(matchedReview?.score ?? matchedReview?.rating ?? 0);

      return {
        brandName: collab.brandName,
        isVerified: collab.isVerified,
        campaignTitle: collab.campaignTitle,
        date: collab.date,
        rating: scoreValue > 0 ? Math.round(scoreValue) : undefined,
        reviewText: (matchedReview?.review || matchedReview?.text || "").trim(),
      };
    });
  }, [collaborations, reviews]);

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
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
            {creatorName} is available for brand integrations, product placements, and
            long-term ambassador campaigns.
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
                    {item.brandName.slice(0, 2).toUpperCase()}
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
                  "{item.reviewText}"
                </blockquote>
              ) : (
                <div className="text-[11px] text-[color:var(--vooki-app-text-muted)] italic pl-3 border-l-2 border-[color:var(--vooki-app-border-strong)]">
                  Campaign verified and completed successfully.
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-[color:var(--vooki-app-text-muted)] pt-2 border-t border-[color:var(--vooki-app-border-strong)]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                    day: "numeric",
                  })}
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
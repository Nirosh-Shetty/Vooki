"use client";

import { MessageSquare, Star, Quote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";


export type ReviewType = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

interface ReviewsCardProps {
  reviews: ReviewType[];
  rating: number;
  totalReviews: number;
}

export function ReviewsCard({ reviews, rating, totalReviews }: ReviewsCardProps) {
  return (
    <Card className="rounded-2xl sm:rounded-3xl border-[color:var(--vooki-app-border)] shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[color:var(--vooki-app-active-icon)]" />
          Reviews & Feedback
        </CardTitle>

        <Badge
          variant="outline"
          className="flex items-center gap-1 font-semibold text-xs border-[color:var(--vooki-app-border-strong)] bg-background/50 text-[color:var(--vooki-app-text-strong)]"
        >
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          {(rating || 0).toFixed(1)}
          <span className="text-[color:var(--vooki-app-text-subtle)] font-normal">
            ({totalReviews})
          </span>
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3">
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="relative rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 hover:border-[color:var(--vooki-app-active-border)] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] text-[10px] font-bold">
                      {getInitials(review.author, "RV")}
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-[color:var(--vooki-app-text-strong)]">
                      {review.author}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < review.rating
                            ? "fill-amber-500 text-amber-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative pl-3 border-l-2 border-[color:var(--vooki-app-active-border)]/40 my-2">
                  {review.text && review.text.length > 0 && (
                    <p className="text-xs sm:text-sm text-[color:var(--vooki-app-text-strong)] leading-relaxed">
                      "{review.text}"
                    </p>
                  )}
                </div>

                <p className="text-[10px] sm:text-xs text-[color:var(--vooki-app-text-subtle)] mt-2 text-right">
                  {review.date}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-6 text-center">
            <p className="text-xs sm:text-sm text-[color:var(--vooki-app-text-soft)] italic">
              No reviews yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

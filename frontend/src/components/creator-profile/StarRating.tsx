"use client";

import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating?: number;
  max?: number;
  size?: string;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating = 0,
  max = 5,
  size = "w-4 h-4",
  showValue = false,
  className = "",
}: StarRatingProps) {
  const safeRating = Math.max(0, Math.min(max, rating || 0));

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }, (_, index) => {
        const fillPercentage = Math.max(0, Math.min(100, (safeRating - index) * 100));

        return (
          <div key={index} className={`relative ${size} shrink-0`}>
            {/* Background Empty Star */}
            <Star
              className={`${size} fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700 absolute top-0 left-0`}
            />

            {/* Foreground Filled Star */}
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

      {showValue && (
        <span className="ml-1 text-xs font-bold text-[color:var(--vooki-app-text-strong)]">
          {safeRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}


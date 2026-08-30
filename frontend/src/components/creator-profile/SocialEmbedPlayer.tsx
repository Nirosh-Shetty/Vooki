"use client";

import React from "react";
import { Play, ArrowUpRight } from "lucide-react";

export function getInstagramEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (match) {
      const type = match[1];
      const id = match[2];
      return `https://www.instagram.com/${type}/${id}/embed/?cr=1&v=14&wp=540&rd=${encodeURIComponent(
        typeof window !== "undefined" ? window.location.origin : ""
      )}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.slice(1).split("?")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.pathname.includes("/shorts/")) {
      const id = parsed.pathname.split("/shorts/")[1]?.split("?")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.searchParams.has("v")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

interface SocialEmbedPlayerProps {
  url: string;
  className?: string;
}

export function SocialEmbedPlayer({ url, className = "" }: SocialEmbedPlayerProps) {
  const ytEmbedUrl = getYouTubeEmbedUrl(url);
  const igEmbedUrl = getInstagramEmbedUrl(url);

  if (ytEmbedUrl) {
    return (
      <iframe
        src={ytEmbedUrl}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className={`w-full h-full border-0 object-cover ${className}`}
      />
    );
  }

  if (igEmbedUrl) {
    return (
      <iframe
        src={igEmbedUrl}
        title="Instagram post"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        className={`w-full h-[calc(100%+56px)] border-0 -mt-[56px] ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white ${className}`}
    >
      <Play className="w-10 h-10 text-zinc-500 mb-2" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 underline underline-offset-2"
      >
        <span>View Content</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}


/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, X, Loader2 } from "lucide-react";
import { messagingAPI } from "@/lib/socket/messaging-api";

interface SearchResult {
  id: string;
  name: string;
  username: string;
  profilePicture?: string;
  role: string;
}

interface SearchPeopleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: SearchResult) => void;
  isLoading?: boolean;
}

const avatarPalette = [
  "#7c3aed",
  "#2563eb",
  "#0f766e",
  "#d97706",
  "#db2777",
  "#059669",
  "#4f46e5",
  "#0284c7",
] as const;

const getAvatarStyle = (user: Pick<SearchResult, "id" | "name">) => {
  const seed = `${user.id || ""}${user.name || ""}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  const paletteIndex = Math.abs(hash) % avatarPalette.length;
  return { backgroundColor: avatarPalette[paletteIndex], color: "#ffffff" };
};

export function SearchPeopleDialog({
  isOpen,
  onClose,
  onSelectUser,
  isLoading = false,
}: SearchPeopleDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        setSearching(true);
        setError(null);
        const data = await messagingAPI.search(query, "users");
        setResults(
          (data.users || []).map((user: any) => ({
            id: user._id || user.id,
            name: user.name,
            username: user.username,
            profilePicture: user.profilePicture,
            role: user.role,
          }))
        );
      } catch (err: any) {
        setError(err.message || "Failed to search users");
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300); // Debounce
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm p-3 sm:items-center sm:justify-center sm:p-4">
      <Card className="w-full max-w-md overflow-hidden rounded-[28px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-card)] shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
        <div className="flex max-h-[85dvh] flex-col p-4">
          <div className="relative mb-4 flex items-center justify-center">
            <h2 className="text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
              Find People
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-0 h-8 w-8 rounded-full text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-3 flex justify-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--vooki-app-text-muted)]" />
              <Input
                placeholder="Search by name or username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 rounded-full border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] pl-10 text-[color:var(--vooki-app-text-strong)] shadow-inner placeholder:text-[color:var(--vooki-app-text-muted)]"
                autoFocus
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {searching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[color:var(--vooki-app-text-muted)]" />
                </div>
              )}

              {error && !searching && (
                <div className="rounded-2xl border border-[color:var(--vooki-warm)]/25 bg-[color:var(--vooki-warm-soft)] p-3 text-sm text-[color:var(--vooki-warm)]">
                  {error}
                </div>
              )}

              {!query.trim() && !searching && (
                <div className="py-8 text-center text-sm text-[color:var(--vooki-app-text-muted)]">
                  Start typing to find people...
                </div>
              )}

              {results.length === 0 && query.trim() && !searching && !error && (
                <div className="py-8 text-center text-sm text-[color:var(--vooki-app-text-muted)]">
                  No people found
                </div>
              )}

              {results.map((user) => {
                const avatarStyle = getAvatarStyle(user);
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      setQuery("");
                    }}
                    disabled={isLoading}
                    className="w-full rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3 text-left transition-colors hover:bg-[color:var(--vooki-app-surface-hover)] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-semibold text-white"
                        style={avatarStyle}
                      >
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{(user.name?.substring(0, 1) || "?").toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-[color:var(--vooki-app-text-muted)]">
                          @{user.username}
                        </p>
                        <p className="text-xs text-[color:var(--vooki-app-text-soft)]">
                          {user.role}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="inline-block rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent-strong)] px-2 py-1 text-xs font-medium text-white dark:bg-[color:var(--vooki-accent-soft)] dark:text-[color:var(--vooki-accent-strong)]">
                          Start
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
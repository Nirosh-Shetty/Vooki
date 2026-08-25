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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 transition-opacity"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                New Conversation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search and connect with creators or brands
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-6 pt-4 pb-2">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search by name or username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 min-h-[180px] max-h-[360px] overflow-y-auto px-6 py-3">
            <div className="space-y-2">
              {searching && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600 dark:text-purple-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Searching users...</p>
                </div>
              )}

              {error && !searching && (
                <div className="rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-600 dark:text-red-400 text-center">
                  {error}
                </div>
              )}

              {!query.trim() && !searching && (
                <div className="py-10 text-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-2">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Type a name or username to find people
                  </p>
                </div>
              )}

              {results.length === 0 && query.trim() && !searching && !error && (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  No users found for &quot;<span className="font-medium text-slate-700 dark:text-slate-300">{query}</span>&quot;
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
                    className="w-full group flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 hover:bg-purple-50/60 dark:bg-slate-800/40 dark:hover:bg-slate-800 hover:border-purple-200 dark:hover:border-purple-900/40 transition-all text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white shadow-xs"
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
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            @{user.username}
                          </p>
                          <span className="inline-block rounded-full bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.2 text-[10px] font-medium capitalize text-slate-600 dark:text-slate-300">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center rounded-full bg-purple-600 group-hover:bg-purple-700 text-white text-xs font-medium px-3 py-1 shadow-xs transition-colors">
                        Chat
                      </span>
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
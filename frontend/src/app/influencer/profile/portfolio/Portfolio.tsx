"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  AlertCircle,
  Pencil,
  Loader2,
  Play,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ShowcaseItem = {
  _id: string;
  url: string;
};

interface ShowcaseProps {
  initialItems?: ShowcaseItem[];
  onUpdate?: (items: ShowcaseItem[]) => void;
}

const MAX_ITEMS = 5;

const isValidPlatformUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    return (
      host === "instagram.com" ||
      host.endsWith(".instagram.com") ||
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be" ||
      host.endsWith(".youtu.be") ||
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.watch" ||
      host.endsWith(".fb.watch") ||
      host === "tiktok.com" ||
      host.endsWith(".tiktok.com")
    );
  } catch {
    return false;
  }
};

function getInstagramEmbedUrl(url: string): string | null {
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

function getYouTubeEmbedUrl(url: string): string | null {
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

function SocialEmbedPlayer({ url }: { url: string }) {
  const ytEmbedUrl = getYouTubeEmbedUrl(url);
  const igEmbedUrl = getInstagramEmbedUrl(url);

  if (ytEmbedUrl) {
    return (
      <iframe
        src={ytEmbedUrl}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full border-0 object-cover"
      />
    );
  }

  if (igEmbedUrl) {
    return (
      <iframe
        src={igEmbedUrl}
        title="Instagram post"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        className="w-full h-[calc(100%+56px)] border-0 -mt-[56px]"
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
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

export function Portfolio({ initialItems = [], onUpdate }: ShowcaseProps) {
  const [items, setItems] = useState<ShowcaseItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState<boolean>(initialItems.length === 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [newUrl, setNewUrl] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [addError, setAddError] = useState("");
  const [editError, setEditError] = useState("");

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchFeaturedContent = async () => {
      if (initialItems.length > 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/influencer/featureContent`,
          {
            method: "GET",
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Server error: ${res.status}`);
        }

        const data = await res.json();
        const contentList: ShowcaseItem[] = data.featuredContent || [];

        if (isMounted) {
          setItems(contentList);
          onUpdate?.(contentList);
        }
      } catch (error: any) {
        console.error("Fetch featured content error:", error.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFeaturedContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAdd = async () => {
    const trimmed = newUrl.trim();
    if (!trimmed || items.length >= MAX_ITEMS) return;

    if (!isValidPlatformUrl(trimmed)) {
      setAddError("Please enter a valid URL from Instagram, YouTube, TikTok, or Facebook.");
      return;
    }

    try {
      setIsSubmitting(true);
      setAddError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/influencer/featureContent`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ url: trimmed }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to add content");
      }

      const updatedList: ShowcaseItem[] = data.featuredContent || [];
      setItems(updatedList);
      onUpdate?.(updatedList);

      setNewUrl("");
      setIsAddModalOpen(false);
    } catch (err: any) {
      setAddError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (item: ShowcaseItem) => {
    setEditingItem(item);
    setEditUrl(item.url);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    const trimmed = editUrl.trim();
    if (!editingItem || !trimmed) return;

    if (!isValidPlatformUrl(trimmed)) {
      setEditError("Please enter a valid URL from Instagram, YouTube, TikTok, or Facebook.");
      return;
    }

    try {
      setIsSubmitting(true);
      setEditError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/influencer/featureContent`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            updatedItem: { id: editingItem._id, url: trimmed },
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update item");
      }

      const updatedList: ShowcaseItem[] =
        data.featuredContent && data.featuredContent.length > 0
          ? data.featuredContent
          : items.map((item) =>
              item._id === editingItem._id ? { ...item, url: trimmed } : item
            );

      setItems(updatedList);
      onUpdate?.(updatedList);

      setEditingItem(null);
      setEditUrl("");
    } catch (err: any) {
      setEditError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/influencer/featureContent/${itemToDelete}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete item");
      }

      const updatedList: ShowcaseItem[] =
        data.featuredContent || items.filter((item) => item._id !== itemToDelete);

      setItems(updatedList);
      onUpdate?.(updatedList);
      setItemToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[color:var(--vooki-app-active-icon)]" />
              <span>Featured Media & Deliverables</span>
            </h2>
            <p className="text-xs text-[color:var(--vooki-app-text-muted)] mt-0.5">
              Showcase up to {MAX_ITEMS} sample reels, TikToks, or YouTube Shorts for brand deals.
            </p>
          </div>

          {!isLoading && items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setAddError("");
                setIsAddModalOpen(true);
              }}
              disabled={items.length >= MAX_ITEMS}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-[color:var(--vooki-app-text-strong)] bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)] hover:bg-[color:var(--vooki-app-surface)] transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add ({items.length}/{MAX_ITEMS})</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2 text-[color:var(--vooki-accent)]" />
            <p className="text-xs">Loading featured deliverables...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-10 text-center space-y-3">
            <Play className="w-8 h-8 mx-auto text-[color:var(--vooki-app-text-muted)]" />
            <p className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
              Portfolio Being Curated
            </p>
            <p className="text-xs text-[color:var(--vooki-app-text-muted)] max-w-sm mx-auto">
              You haven't linked specific media reels yet. Add your YouTube Shorts, Instagram Reels, or sample deliverables to showcase to brands.
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                onClick={() => {
                  setAddError("");
                  setIsAddModalOpen(true);
                }}
                className="rounded-xl px-4 text-xs font-bold bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add First Deliverable
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {items.map((item, index) => (
              <div
                key={item._id || index}
                className="group relative rounded-2xl overflow-hidden border border-[color:var(--vooki-app-border-strong)] bg-black h-[540px] flex flex-col shadow-xs transition-all hover:border-[color:var(--vooki-app-active-border)]"
              >
                {/* Actions Overlay */}
                <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-all shadow-md backdrop-blur-sm cursor-pointer"
                    aria-label="Edit item URL"
                    title="Edit URL"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(item._id)}
                    className="p-2 rounded-full bg-black/70 hover:bg-red-600 text-white transition-all shadow-md backdrop-blur-sm cursor-pointer"
                    aria-label="Remove item"
                    title="Delete item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Social Embed Player */}
                <SocialEmbedPlayer url={item.url} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[color:var(--vooki-app-surface)] p-6 shadow-2xl border border-[color:var(--vooki-app-border-strong)] zoom-in-95 animate-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[color:var(--vooki-app-text-strong)]">
                Add Featured Deliverable
              </h3>
              <button
                type="button"
                onClick={() => {
                  setNewUrl("");
                  setAddError("");
                  setIsAddModalOpen(false);
                }}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[color:var(--vooki-app-text-muted)] mb-4">
              Paste a link to your best Instagram Reel, YouTube Short, or video.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block text-[color:var(--vooki-app-text-strong)]">
                  Deliverable URL
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/reel/... or https://youtube.com/shorts/..."
                  value={newUrl}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setNewUrl(e.target.value);
                    if (addError) setAddError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSubmitting) handleAdd();
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)] ${
                    addError
                      ? "border-red-500"
                      : "border-[color:var(--vooki-app-border-strong)]"
                  }`}
                  autoFocus
                />
                {addError && <p className="text-xs text-red-500 mt-1.5">{addError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl text-xs font-semibold"
                  disabled={isSubmitting}
                  onClick={() => {
                    setNewUrl("");
                    setAddError("");
                    setIsAddModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl text-xs font-bold bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] flex items-center justify-center gap-2 cursor-pointer"
                  onClick={handleAdd}
                  disabled={!newUrl.trim() || items.length >= MAX_ITEMS || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Deliverable
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[color:var(--vooki-app-surface)] p-6 shadow-2xl border border-[color:var(--vooki-app-border-strong)] zoom-in-95 animate-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[color:var(--vooki-app-text-strong)]">
                Edit Featured Deliverable
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditError("");
                }}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block text-[color:var(--vooki-app-text-strong)]">
                  Deliverable URL
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/reel/... or https://youtube.com/shorts/..."
                  value={editUrl}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setEditUrl(e.target.value);
                    if (editError) setEditError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSubmitting) handleSaveEdit();
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)] ${
                    editError
                      ? "border-red-500"
                      : "border-[color:var(--vooki-app-border-strong)]"
                  }`}
                  autoFocus
                />
                {editError && <p className="text-xs text-red-500 mt-1.5">{editError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl text-xs font-semibold"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEditingItem(null);
                    setEditError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl text-xs font-bold bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] flex items-center justify-center gap-2 cursor-pointer"
                  onClick={handleSaveEdit}
                  disabled={!editUrl.trim() || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Update Deliverable
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[color:var(--vooki-app-surface)] p-6 shadow-2xl border border-[color:var(--vooki-app-border-strong)] text-center zoom-in-95 animate-in duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-base font-bold text-[color:var(--vooki-app-text-strong)] mb-2">
              Remove Deliverable
            </h3>
            <p className="text-xs text-[color:var(--vooki-app-text-muted)] mb-6">
              Are you sure you want to remove this reel from your media kit? You can always add it back later.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl text-xs font-semibold"
                disabled={isSubmitting}
                onClick={() => setItemToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 cursor-pointer"
                disabled={isSubmitting}
                onClick={confirmDelete}
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
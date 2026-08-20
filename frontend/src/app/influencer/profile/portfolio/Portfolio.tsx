"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Star, AlertCircle, Video, Pencil, Loader2, FolderKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InstagramEmbed, YouTubeEmbed, FacebookEmbed } from "react-social-media-embed";

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
      host.endsWith(".fb.watch")
    );
  } catch {
    return false;
  }
};

const renderSocialEmbed = (url: string) => {
  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return <YouTubeEmbed url={url} width="100%" />;
    }
    if (url.includes("instagram.com")) {
      return <InstagramEmbed url={url} width="100%" />;
    }
    if (url.includes("facebook.com") || url.includes("fb.watch")) {
      return <FacebookEmbed url={url} width="100%" />;
    }
    return null;
  } catch {
    return <p className="text-sm text-red-500">Failed to render embed</p>;
  }
};

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
      setAddError("Please enter a valid URL from Instagram, YouTube, or Facebook.");
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
      setEditError("Please enter a valid URL from Instagram, YouTube, or Facebook.");
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
      <Card className="rounded-3xl border-[color:var(--vooki-app-border)] shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-[color:var(--vooki-app-active-icon)]" />
                <span>Portfolio & Featured Content</span>
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Showcase up to {MAX_ITEMS} of your best performing posts, videos, or campaigns.
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
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Content ({items.length}/{MAX_ITEMS})
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-xs">Loading featured content...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 py-14 text-center">
              <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Video className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No featured content added yet
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
                Paste links from Instagram, YouTube, or Facebook to feature your best posts here.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAddError("");
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Item
              </button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <div
                  key={item._id}
                  className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 h-[525px] flex flex-col bg-zinc-50 dark:bg-zinc-900"
                >
                  <div className="absolute right-2 top-2 z-20 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-all shadow-md backdrop-blur-sm cursor-pointer"
                      aria-label="Edit item URL"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item._id)}
                      className="p-2 rounded-full bg-black/70 hover:bg-red-600 text-white transition-all shadow-md backdrop-blur-sm cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="absolute left-2 top-2 z-20">
                    <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm pointer-events-none flex items-center gap-1.5">
                      <Star className="h-3 w-3 fill-current" />
                      Featured Pick {index + 1}
                    </div>
                  </div>

                  {/* Combined key forces full re-render of embed when URL changes */}
                  <div
                    key={`${item._id}-${item.url}`}
                    className="w-full h-full overflow-y-auto flex items-center justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  >
                    <div className="w-full">{renderSocialEmbed(item.url)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Add to Portfolio</h3>
              <button
                onClick={() => {
                  setNewUrl("");
                  setAddError("");
                  setIsAddModalOpen(false);
                }}
                disabled={isSubmitting}
                className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">
                  Post URL
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/..., youtube.com/..., facebook.com/..."
                  value={newUrl}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setNewUrl(e.target.value);
                    if (addError) setAddError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSubmitting) handleAdd();
                  }}
                  className={`w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:border-zinc-700 ${
                    addError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-zinc-300 focus:ring-blue-500"
                  }`}
                  autoFocus
                />
                {addError && <p className="text-xs text-red-500 mt-1.5">{addError}</p>}
              </div>

              <Button
                className="w-full rounded-xl mt-4 flex items-center justify-center gap-2"
                onClick={handleAdd}
                disabled={!newUrl.trim() || items.length >= MAX_ITEMS || isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save to Portfolio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Edit Featured Content</h3>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setEditError("");
                }}
                disabled={isSubmitting}
                className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">
                  Post URL
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/..., youtube.com/..., facebook.com/..."
                  value={editUrl}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setEditUrl(e.target.value);
                    if (editError) setEditError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSubmitting) handleSaveEdit();
                  }}
                  className={`w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 dark:border-zinc-700 ${
                    editError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-zinc-300 focus:ring-blue-500"
                  }`}
                  autoFocus
                />
                {editError && <p className="text-xs text-red-500 mt-1.5">{editError}</p>}
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEditingItem(null);
                    setEditError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl flex items-center justify-center gap-2"
                  onClick={handleSaveEdit}
                  disabled={!editUrl.trim() || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center zoom-in-95 animate-in duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Remove Content</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Are you sure you want to remove this item from your portfolio? You can always add it back later.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={isSubmitting}
                onClick={() => setItemToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                disabled={isSubmitting}
                onClick={confirmDelete}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
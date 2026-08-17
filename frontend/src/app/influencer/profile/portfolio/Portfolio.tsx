"use client";

import { useState } from "react";
import { Plus, Trash2, X, Star, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InstagramEmbed, YouTubeEmbed, FacebookEmbed } from "react-social-media-embed";

export type ShowcaseItem = {
  id: string;
  url: string;
};

interface ShowcaseProps {
  initialItems?: ShowcaseItem[];
  onUpdate?: (items: ShowcaseItem[]) => void;
}

const MAX_ITEMS = 3;

const renderSocialEmbed = (url: string) => {
  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return <YouTubeEmbed url={url} width="100%" />;
    }
    if (url.includes("instagram.com")) {
      return <InstagramEmbed url={url} width="100%" />;
    }
    if (url.includes("facebook.com")) {
      return <FacebookEmbed url={url} width="100%" />;
    }
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-zinc-100 text-center dark:bg-zinc-800">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-500 hover:underline break-all"
        >
          View external link
        </a>
      </div>
    );
  } catch (e) {
    return <p className="text-sm text-red-500">Invalid URL format</p>;
  }
};

export function Portfolio({ initialItems = [], onUpdate }: ShowcaseProps) {
  const [items, setItems] = useState<ShowcaseItem[]>(initialItems);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");

  const handleAdd = () => {
    if (!newUrl.trim() || items.length >= MAX_ITEMS) return;

    const newItem: ShowcaseItem = {
      id: Date.now().toString(),
      url: newUrl,
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onUpdate?.(updatedItems);

    setNewUrl("");
    setIsAddModalOpen(false);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    const updatedItems = items.filter((item) => item.id !== itemToDelete);
    setItems(updatedItems);
    onUpdate?.(updatedItems);
    setItemToDelete(null);
  };

  const openAddModal = () => {
    if (items.length >= MAX_ITEMS) return;
    setIsAddModalOpen(true);
  };

  return (
    <>
      <Card className="rounded-3xl border-[color:var(--vooki-app-border)] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)] flex items-center gap-2">
                Portfolio & Featured Content
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Showcase your top {MAX_ITEMS} best performing posts, videos, or campaigns.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {/* Render exactly 3 slots */}
          {Array.from({ length: MAX_ITEMS }).map((_, index) => {
            const item = items[index];

            if (item) {
              // UPLOADED ITEM
              return (
                <div
                  key={item.id}
                  className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 h-[525px] flex flex-col bg-zinc-50 dark:bg-zinc-900"
                >
                  <button
                    onClick={() => setItemToDelete(item.id)}
                    className="absolute right-2 top-2 z-20 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="absolute left-2 top-2 z-20">
                    <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm pointer-events-none flex items-center gap-1.5">
                      <Star className="h-3 w-3 fill-current" />
                      Featured Pick {index + 1}
                    </div>
                  </div>

                  <div className="w-full h-full overflow-y-auto flex items-center justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="w-full">{renderSocialEmbed(item.url)}</div>
                  </div>
                </div>
              );
            }

            // EMPTY SLOT
            return (
              <div
                key={`empty-${index}`}
                onClick={openAddModal}
                className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 h-[525px] transition-all hover:border-zinc-400 dark:hover:border-zinc-600 group"
              >
                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="h-5 w-5 text-zinc-500" />
                </div>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  Add Featured Content
                </p>
                <p className="text-xs text-zinc-400 mt-1 text-center max-w-[200px]">
                  Paste a link from Facebook, Instagram, or YouTube
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Add to Portfolio</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
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
                  placeholder="Paste Instagram, YouTube, or Facebook link..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                  autoFocus
                />
              </div>

              <Button
                className="w-full rounded-xl mt-4"
                onClick={handleAdd}
                disabled={!newUrl.trim()}
              >
                Save to Portfolio
              </Button>
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
                onClick={() => setItemToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
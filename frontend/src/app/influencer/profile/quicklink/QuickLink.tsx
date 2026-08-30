"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Youtube,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Edit2,
  Loader2,
  ExternalLink,
  Link as LinkIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type QuickLinksProps = {
  links?: Record<string, string>;
  onUpdate?: (links: Record<string, string>) => void;
};

// Configuration strictly for the 3 requested platforms
const PLATFORM_CONFIG = {
  Instagram: {
    icon: Instagram,
    colorClass: "text-pink-500 dark:text-pink-400",
    label: "Instagram",
  },
  Facebook: {
    icon: Facebook,
    colorClass: "text-blue-600 dark:text-blue-400",
    label: "Facebook"
  },
  YouTube: {
    icon: Youtube,
    colorClass: "text-red-500 dark:text-red-500",
    label: "YouTube"
  },
} as const;

type PlatformKey = keyof typeof PLATFORM_CONFIG;

export function QuickLinks({ links = {}, onUpdate }: QuickLinksProps) {
  const [currentLinks, setCurrentLinks] = useState<Record<string, string>>(links);

  // Modal states
  const [managePlatform, setManagePlatform] = useState<PlatformKey | null>(null);
  const [editPlatform, setEditPlatform] = useState<PlatformKey | null>(null);
  const [deletePlatform, setDeletePlatform] = useState<PlatformKey | null>(null);

  const [newUrl, setNewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Helper to safely find a link regardless of capitalization
  const getLinkForPlatform = (platform: PlatformKey) => {
    const entry = Object.entries(currentLinks).find(
      ([key]) => key.toLowerCase() === platform.toLowerCase()
    );
    return entry && entry[1] ? entry[1] : undefined;
  };

  const platforms = Object.keys(PLATFORM_CONFIG) as PlatformKey[];

  // API Call to save the changes
  const handleSaveAPI = async (payloadLinks: Record<string, string>) => {
    setIsLoading(true);
    try {
      const payload = { influencerProfile: { socialLinks: payloadLinks } };

      console.log("Saving links to backend:", payload);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/influencer`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update quick links");

      setCurrentLinks(payloadLinks);
      onUpdate?.(payloadLinks);
    } catch (error) {
      console.error("Error saving links:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLink = async () => {
    if (!editPlatform || !newUrl.trim()) return;

    const updatedLinks = { ...currentLinks };
    updatedLinks[editPlatform] = newUrl.trim();

    console.log("Saving updated links:", updatedLinks);
    await handleSaveAPI(updatedLinks);

    setEditPlatform(null);
    setNewUrl("");
  };

  const confirmDelete = async () => {
    if (!deletePlatform) return;

    const updatedLinks = { ...currentLinks };
    Object.keys(updatedLinks).forEach(key => {
      if (key.toLowerCase() === deletePlatform.toLowerCase()) {
        delete updatedLinks[key];
      }
    });

    await handleSaveAPI(updatedLinks);
    setDeletePlatform(null);
  };

  const openEditModal = (platform: PlatformKey, url: string = "") => {
    setEditPlatform(platform);
    setNewUrl(url);
  };

  return (
    <>
      <Card className="rounded-3xl border-[color:var(--vooki-app-border)] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-[color:var(--vooki-app-text-strong)]">
            Quick Links
            <LinkIcon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-3 gap-3">
          {platforms.map((platform) => {
            const { icon: Icon, colorClass, label } = PLATFORM_CONFIG[platform];
            const url = getLinkForPlatform(platform);

            if (url) {
              // Active UI state (Link added) - Now opens manage dialog on click
              return (
                <button
                  key={platform}
                  onClick={() => setManagePlatform(platform)}
                  className="hover:cursor-pointer group flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-transparent p-3 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[color:var(--vooki-app-active-border)]"
                >
                  <Icon className={`h-5 w-5 transition-transform ${colorClass}`} />
                  <span className="w-full truncate text-center text-[10px] font-medium text-[color:var(--vooki-app-text-strong)]">
                    {label}
                  </span>
                </button>
              );
            }

            // Missing UI state (Link not added)
            return (
              <div
                key={platform}
                onClick={() => openEditModal(platform)}
                className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-3 hover:bg-zinc-100 dark:border-zinc-700/80 dark:bg-zinc-900/20 dark:hover:bg-zinc-800/50 transition-colors"
                title={`Add ${label} link`}
              >
                <div className="relative group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-zinc-200 p-0.5 dark:bg-zinc-800">
                    <Plus className="h-2 w-2 text-zinc-500 dark:text-zinc-400" />
                  </div>
                </div>
                <span className="w-full truncate text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                  Add Link
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* MANAGE PLATFORM MODAL */}
      {managePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 zoom-in-95 animate-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                Manage {PLATFORM_CONFIG[managePlatform].label}
              </h3>
              <button
                onClick={() => setManagePlatform(null)}
                className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 rounded-xl h-11"
                onClick={() => {
                  const url = getLinkForPlatform(managePlatform);
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                  setManagePlatform(null);
                }}
              >
                <ExternalLink className="h-4 w-4 text-zinc-500" />
                Visit Link
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 rounded-xl h-11"
                onClick={() => {
                  const url = getLinkForPlatform(managePlatform);
                  openEditModal(managePlatform, url);
                  setManagePlatform(null);
                }}
              >
                <Edit2 className="h-4 w-4 text-zinc-500" />
                Edit Link
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 rounded-xl h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-500 dark:hover:bg-red-950"
                onClick={() => {
                  setDeletePlatform(managePlatform);
                  setManagePlatform(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Remove Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT LINK MODAL */}
      {editPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">
                {getLinkForPlatform(editPlatform) ? "Edit" : "Add"} {PLATFORM_CONFIG[editPlatform].label} Link
              </h3>
              <button
                onClick={() => setEditPlatform(null)}
                className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-zinc-700 dark:text-zinc-300">
                  Profile URL
                </label>
                <input
                  type="url"
                  placeholder={`Paste your ${PLATFORM_CONFIG[editPlatform].label} link...`}
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <Button
                className="w-full rounded-xl mt-4"
                onClick={handleSaveLink}
                disabled={!newUrl.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center zoom-in-95 animate-in duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Remove Link</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Are you sure you want to remove your {PLATFORM_CONFIG[deletePlatform].label} link?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDeletePlatform(null)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
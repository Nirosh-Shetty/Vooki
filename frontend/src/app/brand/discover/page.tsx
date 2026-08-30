"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  CheckCircle2,
  ChevronDown,
  Facebook,
  Instagram,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
  Youtube,
} from "lucide-react";
import { CreateInviteModal } from "@/components/collaboration/CreateInviteModal";

type Creator = {
  id: string;
  name: string;
  handle: string;
  niche: string;
  location: string;
  summary?: string;
  followers: number;
  engagementRate: number;
  avgViews: number;
  estCpv: number;
  fitScore: number;
  tags: string[];
  verified: boolean;
  avatar?: string;
  platforms?: string[];
  rating?: number;
  totalReviews?: number;
  pricing?: {
    reel?: number;
    story?: number;
    youtubeIntegration?: number;
  };
};

type DiscoverResponse = {
  items: Creator[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

type SentInvite = {
  id: string;
  influencerId: string;
  campaignId: string;
  status: "pending" | "accepted" | "rejected" | "expired";
};

type SentInviteResponse = {
  items: SentInvite[];
};

type CampaignOption = {
  id: string;
  name: string;
};

type CampaignListResponse = {
  items?: CampaignOption[];
};

type MultiSelectOption = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const NICHE_OPTIONS: MultiSelectOption[] = [
  { label: "Fashion", value: "Fashion" },
  { label: "Lifestyle", value: "Lifestyle" },
  { label: "Tech", value: "Tech" },
  { label: "Wellness", value: "Wellness" },
  { label: "Beauty", value: "Beauty" },
  { label: "Fitness", value: "Fitness" },
  { label: "Finance", value: "Finance" },
  { label: "Food", value: "Food" },
  { label: "Travel", value: "Travel" },
  { label: "Gaming", value: "Gaming" },
  { label: "Entertainment", value: "Entertainment" },
];

const PLATFORM_OPTIONS: MultiSelectOption[] = [
  { label: "Instagram", value: "instagram", icon: Instagram },
  { label: "YouTube", value: "youtube", icon: Youtube },
  { label: "Facebook", value: "facebook", icon: Facebook },
];

type FollowerTierOption = MultiSelectOption & {
  min: number;
  max: number;
};

const FOLLOWER_TIERS: FollowerTierOption[] = [
  { label: "1K - 10K (Nano)", value: "1", min: 1000, max: 10000 },
  { label: "10K - 50K (Micro)", value: "2", min: 10000, max: 50000 },
  { label: "50K - 200K (Mid-Tier)", value: "3", min: 50000, max: 200000 },
  { label: "200K - 1M (Macro)", value: "4", min: 200000, max: 1000000 },
  { label: "1M+ (Mega)", value: "5", min: 1000000, max: Infinity },
];

const SORT_OPTIONS = [
  { label: "Highest Followers", value: "followers" },
  { label: "Top Engagement", value: "engagement" },
  { label: "Most Views", value: "views" },
];

const formatCompact = (value: number) => {
  if (!value || Number.isNaN(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
};

const getInitials = (name?: string) => {
  if (!name) return "C";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
  className = "w-40 sm:w-44",
}: {
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
}) {
  const isAll = selectedValues.length === 0;
  const isAllSelected = selectedValues.length === options.length;

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length || selectedValues.length === 0) {
      onChange([]);
    } else {
      onChange([]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return `All ${label}`;
    if (selectedValues.length === 1) {
      const found = options.find((o) => o.value === selectedValues[0]);
      return found ? found.label : selectedValues[0];
    }
    return `${label} (${selectedValues.length})`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex h-10 items-center justify-between gap-2 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-3 text-xs font-semibold text-[color:var(--vooki-app-text-strong)] shadow-xs transition-all hover:border-[color:var(--vooki-accent)] cursor-pointer ${className}`}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-strong)] shadow-2xl rounded-2xl p-1.5 max-h-72 overflow-y-auto"
      >
        <DropdownMenuCheckboxItem
          checked={isAll || isAllSelected}
          onCheckedChange={handleSelectAll}
          onSelect={(e) => e.preventDefault()}
          className="text-xs font-bold rounded-lg cursor-pointer"
        >
          All {label}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator className="bg-[color:var(--vooki-app-border)] my-1" />
        {options.map((opt) => {
          const isChecked = selectedValues.includes(opt.value);
          const Icon = opt.icon;
          return (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={isChecked}
              onCheckedChange={() => handleToggle(opt.value)}
              onSelect={(e) => e.preventDefault()}
              className="text-xs font-medium rounded-lg cursor-pointer flex items-center gap-2"
            >
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
              <span>{opt.label}</span>
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("followers");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [shortlist, setShortlist] = useState<string[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inviting & Campaigns
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [inviteBusyIds, setInviteBusyIds] = useState<string[]>([]);
  const [inviteCampaignId, setInviteCampaignId] = useState("");
  const [shortlistBusyIds, setShortlistBusyIds] = useState<string[]>([]);
  const [isSavedDialogOpen, setIsSavedDialogOpen] = useState(false);

  const fetchSentInvites = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites?status=all&limit=50`,
        { credentials: "include" }
      );
      if (!response.ok) return;
      const data: SentInviteResponse = await response.json();
      setSentInvites(Array.isArray(data.items) ? data.items : []);
    } catch {
      // Keep UI functional
    }
  }, []);

  const hasRestoredScrollRef = useRef(false);

  const getScrollContainer = useCallback((): HTMLElement | null => {
    if (typeof document === "undefined") return null;
    return (
      document.getElementById("workspace-main-content") ||
      document.querySelector("main")
    );
  }, []);

  const getScrollPos = useCallback((): number => {
    const mainEl = getScrollContainer();
    if (mainEl && mainEl.scrollTop > 0) {
      return mainEl.scrollTop;
    }
    return window.scrollY || document.documentElement.scrollTop || 0;
  }, [getScrollContainer]);

  const setScrollPos = useCallback(
    (top: number) => {
      const mainEl = getScrollContainer();
      if (mainEl) {
        mainEl.scrollTop = top;
      }
      window.scrollTo({ top, behavior: "instant" });
    },
    [getScrollContainer]
  );

  // Restore exact scroll position after live creators are loaded and rendered
  useEffect(() => {
    if (!loading && creators.length > 0 && !hasRestoredScrollRef.current) {
      hasRestoredScrollRef.current = true;
      const savedPos = sessionStorage.getItem("discoverScrollPos");
      if (savedPos) {
        const targetY = parseInt(savedPos, 10);
        if (!isNaN(targetY) && targetY > 0) {
          const restore = () => setScrollPos(targetY);
          requestAnimationFrame(() => {
            restore();
            setTimeout(restore, 40);
            setTimeout(restore, 120);
          });
        }
      }
    }
  }, [loading, creators.length, setScrollPos]);

  // Track and save user scroll position once initial restoration is done
  useEffect(() => {
    const handleScroll = () => {
      if (hasRestoredScrollRef.current && !loading) {
        const pos = getScrollPos();
        sessionStorage.setItem("discoverScrollPos", pos.toString());
      }
    };

    const mainEl = getScrollContainer();
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });

    return () => {
      if (mainEl) {
        mainEl.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [loading, getScrollContainer, getScrollPos]);

  const recordScrollPosition = useCallback(() => {
    const pos = getScrollPos();
    sessionStorage.setItem("discoverScrollPos", pos.toString());
  }, [getScrollPos]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        params.set("limit", "50");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/influencers?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!response.ok) throw new Error("Failed to fetch");
        const data: DiscoverResponse = await response.json();
        setCreators(data.items || []);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Unable to load live discover data. Please check your connection.");
        setCreators([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(load, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const loadShortlist = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/shortlist`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.influencerIds)) {
          setShortlist(data.influencerIds.map((v: string) => String(v)));
        }
      } catch {}
    };
    loadShortlist();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetchSentInvites();
  }, [fetchSentInvites]);

  useEffect(() => {
    const controller = new AbortController();
    const loadCampaigns = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/campaigns?limit=50`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );
        if (!response.ok) return;
        const data: CampaignListResponse = await response.json();
        setCampaigns(Array.isArray(data.items) ? data.items : []);
      } catch {}
    };
    loadCampaigns();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!loading) {
      const savedScroll = sessionStorage.getItem("discoverScrollPos");
      if (savedScroll) {
        // A slight timeout ensures the DOM has painted the grid before scrolling
        setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedScroll, 10),
            behavior: "instant",
          });
        }, 50);
      }
    }
  }, [loading]);

  const filteredCreators = useMemo(() => {
    return creators
      .filter((creator) => {
        // Search filter
        const matchesSearch =
          search.trim() === "" ||
          creator.name.toLowerCase().includes(search.toLowerCase()) ||
          creator.handle.toLowerCase().includes(search.toLowerCase()) ||
          creator.niche.toLowerCase().includes(search.toLowerCase()) ||
          (creator.location && creator.location.toLowerCase().includes(search.toLowerCase()));

        // Niche filter (multi-select)
        const matchesNiche =
          selectedNiches.length === 0 ||
          selectedNiches.some((n) => creator.niche.toLowerCase().includes(n.toLowerCase()));

        // Platform filter (multi-select)
        const matchesPlatform =
          selectedPlatforms.length === 0 ||
          (Array.isArray(creator.platforms) &&
            selectedPlatforms.some((p) => creator.platforms?.includes(p)));

        // Follower tier filter (multi-select)
        const matchesTier =
          selectedTiers.length === 0 ||
          selectedTiers.some((tierVal) => {
            const tier = FOLLOWER_TIERS.find((t) => t.value === tierVal);
            if (!tier) return false;
            return creator.followers >= tier.min && creator.followers <= tier.max;
          });

        return matchesSearch && matchesNiche && matchesPlatform && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === "engagement") return b.engagementRate - a.engagementRate;
        if (sortBy === "views") return b.avgViews - a.avgViews;
        return b.followers - a.followers;
      });
  }, [creators, search, selectedNiches, selectedPlatforms, selectedTiers, sortBy]);

  const toggleShortlist = async (creatorId: string) => {
    const isSaved = shortlist.includes(creatorId);
    setShortlistBusyIds((prev) => [...prev, creatorId]);
    try {
      const response = await fetch(
        isSaved
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/shortlist/${creatorId}`
          : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/shortlist`,
        {
          method: isSaved ? "DELETE" : "POST",
          headers: isSaved ? undefined : { "Content-Type": "application/json" },
          credentials: "include",
          body: isSaved ? undefined : JSON.stringify({ influencerId: creatorId }),
        }
      );
      if (!response.ok) throw new Error("Failed to update shortlist");
      setShortlist((prev) =>
        isSaved ? prev.filter((id) => id !== creatorId) : Array.from(new Set([...prev, creatorId]))
      );
    } catch {
      setShortlist((prev) =>
        isSaved ? prev.filter((id) => id !== creatorId) : Array.from(new Set([...prev, creatorId]))
      );
    } finally {
      setShortlistBusyIds((prev) => prev.filter((id) => id !== creatorId));
    }
  };

  const sendInvites = async (targetId: string) => {
    if (!inviteCampaignId) {
      alert("Please select a target campaign first.");
      return;
    }
    const idsToInvite = targetId === "bulk" ? shortlist : [targetId];
    if (!idsToInvite.length) return;

    setInviteBusyIds((prev) => [...prev, targetId]);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/discover/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          influencerIds: idsToInvite,
          campaignId: inviteCampaignId,
          campaignLabel: campaigns.find((c) => c.id === inviteCampaignId)?.name || "Campaign",
          note: "Invitation sent from Discover",
        }),
      });
      if (!response.ok) throw new Error("Failed to send invites");
      await fetchSentInvites();
      if (targetId === "bulk") {
        alert("Bulk invites sent successfully!");
        setIsSavedDialogOpen(false);
      } else {
        alert("Invite sent successfully!");
      }
    } catch {
      alert("Failed to send invites");
    } finally {
      setInviteBusyIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  const shortlistedCreators = creators.filter((c) => shortlist.includes(c.id));

  const clearAllFilters = () => {
    setSearch("");
    setSelectedPlatforms([]);
    setSelectedNiches([]);
    setSelectedTiers([]);
    setSortBy("followers");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedPlatforms.length > 0 ||
    selectedNiches.length > 0 ||
    selectedTiers.length > 0 ||
    sortBy !== "followers";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <>
        {/* 1. Sleek Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
              Discover Creators
            </h1>
            <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)] max-w-xl">
              Find, evaluate, and collaborate with creators.
            </p>
          </div>
        </div>

        {/* 2. Compact Search & Actions Bar */}
        <Card className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] rounded-3xl overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row items-center gap-3">
              {/* Search Input Bar */}
              <div className="relative w-full flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--vooki-app-text-soft)] pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search creators by name, @username, niche, or location..."
                  className="h-10 sm:h-12 rounded-2xl border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] pl-11 pr-10 text-xs sm:text-sm font-medium text-[color:var(--vooki-app-text-strong)] placeholder:text-[color:var(--vooki-app-text-subtle)] focus-visible:ring-1 focus-visible:ring-[color:var(--vooki-accent)] shadow-xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface)] hover:text-[color:var(--vooki-app-text-strong)] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Actions (Campaign Selector & Saved Drawer Trigger) */}
              <div className="flex w-full lg:w-auto items-center gap-3 shrink-0">
                {/* Target Campaign Selector */}
                <div className="w-full lg:w-60">
                  <Select value={inviteCampaignId} onValueChange={setInviteCampaignId}>
                    <SelectTrigger className="h-10 sm:h-12 w-full rounded-2xl lg:rounded-xl border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-xs font-semibold text-[color:var(--vooki-app-text-strong)] shadow-xs focus:ring-1 focus:ring-[color:var(--vooki-accent)]">
                      <SelectValue placeholder="Target Campaign..." />
                    </SelectTrigger>
                    <SelectContent className="border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-strong)] shadow-2xl rounded-2xl">
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Saved Creators Trigger */}
                <Dialog open={isSavedDialogOpen} onOpenChange={setIsSavedDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 sm:h-12 rounded-2xl lg:rounded-xl border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] hover:border-[color:var(--vooki-accent)] text-xs font-bold px-4 shadow-xs transition-all cursor-pointer"
                    >
                      <Bookmark className="mr-1.5 h-3.5 w-3.5 text-[color:var(--vooki-accent)]" />
                      Saved
                      {shortlist.length > 0 && (
                        <span className="ml-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[color:var(--vooki-accent)] px-1 text-[10px] font-extrabold text-[color:var(--vooki-accent-text)]">
                          {shortlist.length}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-[color:var(--vooki-app-surface)] border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] shadow-2xl rounded-3xl p-6">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base font-bold">
                        <BookmarkCheck className="h-4 w-4 text-[color:var(--vooki-accent)]" />
                        Saved Shortlist ({shortlist.length})
                      </DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[50vh] overflow-y-auto space-y-2.5 mt-4 pr-1">
                      {shortlistedCreators.length === 0 ? (
                        <div className="text-center py-10 opacity-60">
                          <Bookmark className="h-10 w-10 mx-auto mb-2 opacity-40 text-[color:var(--vooki-app-text-soft)]" />
                          <p className="text-sm font-semibold">No creators bookmarked yet.</p>
                          <p className="text-xs text-[color:var(--vooki-app-text-subtle)] mt-1">
                            Click the bookmark icon on any creator card to add them here.
                          </p>
                        </div>
                      ) : (
                        shortlistedCreators.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-3 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] transition-all hover:border-[color:var(--vooki-accent)]/50"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-10 w-10 rounded-full border border-[color:var(--vooki-app-border)] shrink-0">
                                <AvatarImage src={c.avatar} alt={c.name} className="object-cover rounded-full" />
                                <AvatarFallback className="text-xs font-bold bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] rounded-full">
                                  {getInitials(c.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <Link
                                  href={`/brand/discover/${c.id}`}
                                  onClick={recordScrollPosition}
                                  className="font-bold text-xs truncate hover:text-[color:var(--vooki-accent)] transition-colors block"
                                >
                                  {c.name}
                                </Link>
                                <p className="text-[11px] text-[color:var(--vooki-app-text-soft)] truncate">
                                  {c.handle} • {formatCompact(c.followers)} followers
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleShortlist(c.id)}
                                className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-xl"
                                title="Remove from saved"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {shortlistedCreators.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[color:var(--vooki-app-border)] space-y-2">
                        <Button
                          onClick={() => sendInvites("bulk")}
                          disabled={inviteBusyIds.includes("bulk") || !inviteCampaignId}
                          className="w-full h-10 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {inviteBusyIds.includes("bulk") ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-3.5 w-3.5" />
                          )}
                          Bulk Invite All ({shortlist.length})
                        </Button>
                        {!inviteCampaignId && (
                          <p className="text-[11px] text-center text-amber-500 font-medium">
                            Please select a campaign from the top bar first
                          </p>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </>

      {/* 2. Interactive Dropdown Filters Toolbar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Multi-Select Platform Dropdown */}
          <MultiSelectFilter
            label="Platforms"
            options={PLATFORM_OPTIONS}
            selectedValues={selectedPlatforms}
            onChange={setSelectedPlatforms}
          />

          {/* 2. Multi-Select Niche Dropdown */}
          <MultiSelectFilter
            label="Niches"
            options={NICHE_OPTIONS}
            selectedValues={selectedNiches}
            onChange={setSelectedNiches}
          />

          {/* 3. Multi-Select Followers Dropdown */}
          <MultiSelectFilter
            label="Followers"
            options={FOLLOWER_TIERS}
            selectedValues={selectedTiers}
            onChange={setSelectedTiers}
            className="w-44 sm:w-48"
          />

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[color:var(--vooki-accent)] hover:underline font-bold px-2 py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="w-44 sm:w-48">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10 rounded-xl border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-xs font-semibold text-[color:var(--vooki-app-text-strong)] shadow-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-strong)] rounded-xl">
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
          {error}
        </div>
      )}

      {/* 3. Creator Cards Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[color:var(--vooki-app-surface-strong)]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-[color:var(--vooki-app-surface-strong)] rounded" />
                  <div className="h-3 w-20 bg-[color:var(--vooki-app-surface-strong)] rounded" />
                </div>
              </div>
              <div className="h-16 bg-[color:var(--vooki-app-surface-strong)] rounded-2xl" />
              <div className="grid grid-cols-4 gap-2">
                <div className="h-10 bg-[color:var(--vooki-app-surface-strong)] rounded-xl" />
                <div className="h-10 bg-[color:var(--vooki-app-surface-strong)] rounded-xl" />
                <div className="h-10 bg-[color:var(--vooki-app-surface-strong)] rounded-xl" />
                <div className="h-10 bg-[color:var(--vooki-app-surface-strong)] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCreators.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[color:var(--vooki-app-border-strong)] p-12 text-center bg-[color:var(--vooki-app-surface)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--vooki-app-surface-strong)] mx-auto mb-3 text-[color:var(--vooki-app-text-soft)]">
            <Users className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-[color:var(--vooki-app-text-strong)]">
            No creators match your filters
          </h3>
          <p className="text-xs text-[color:var(--vooki-app-text-soft)] max-w-sm mx-auto mt-1">
            Try adjusting your search query, platforms, niches, or follower tiers.
          </p>
          <Button
            onClick={clearAllFilters}
            variant="outline"
            className="mt-4 rounded-xl border-[color:var(--vooki-app-border-strong)] text-xs font-semibold cursor-pointer"
          >
            Clear All Filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCreators.map((creator) => {
            const saved = shortlist.includes(creator.id);
            const isSaving = shortlistBusyIds.includes(creator.id);
            const hasPendingInvite = sentInvites.some(
              (invite) => invite.influencerId === creator.id && invite.status === "pending"
            );

            return (
              <div
                key={creator.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-5 sm:p-6 transition-all duration-200 hover:border-[color:var(--vooki-app-active-border)] hover:shadow-md min-h-[300px]"
              >
                {/* Top Section: Avatar, Name, Badges & Save Button */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Link
                        href={`/brand/discover/${creator.id}`}
                        onClick={recordScrollPosition}
                        className="relative shrink-0"
                      >
                        <Avatar className="h-13 w-13 rounded-full border-2 border-[color:var(--vooki-app-surface)] shadow-xs">
                          <AvatarImage
                            src={creator.avatar}
                            alt={creator.name}
                            className="object-cover rounded-full"
                          />
                          <AvatarFallback className="bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] font-extrabold text-sm rounded-full">
                            {getInitials(creator.name)}
                          </AvatarFallback>
                        </Avatar>
                        {creator.verified && (
                          <span
                            className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs"
                            title="Verified Creator"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </span>
                        )}
                      </Link>

                      <div className="min-w-0 space-y-0.5">
                        <Link
                          href={`/brand/discover/${creator.id}`}
                          onClick={recordScrollPosition}
                          className="font-extrabold text-sm sm:text-base text-[color:var(--vooki-app-text-strong)] transition-colors truncate block"
                        >
                          {creator.name}
                        </Link>
                        <p className="text-[11px] text-[color:var(--vooki-app-text-soft)] truncate font-medium">
                          {creator.handle}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[color:var(--vooki-app-text-subtle)]">
                          <span className="font-semibold text-[color:var(--vooki-app-text-soft)]">
                            {creator.niche}
                          </span>
                          <span>•</span>
                          <span className="flex items-center truncate">
                            <MapPin className="h-2.5 w-2.5 mr-0.5" />
                            {creator.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bookmark / Shortlist Button */}
                    <button
                      type="button"
                      onClick={() => toggleShortlist(creator.id)}
                      disabled={isSaving}
                      className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        saved
                          ? "bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] shadow-xs"
                          : "bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-soft)] border border-[color:var(--vooki-app-border)] hover:text-[color:var(--vooki-app-text-strong)]"
                      }`}
                      title={saved ? "Remove from saved" : "Save creator"}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : saved ? (
                        <Bookmark className="h-3.5 w-3.5 fill-current" />
                      ) : (
                        <BookmarkPlus className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Connected Platforms Row */}
                  <div className="mt-4 flex items-center gap-1.5">
                    {creator.platforms?.includes("instagram") && (
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-500 text-[10px] font-semibold"
                        title="Instagram Connected"
                      >
                        <Instagram className="h-3 w-3" />
                        <span>Instagram</span>
                      </div>
                    )}
                    {creator.platforms?.includes("youtube") && (
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-semibold"
                        title="YouTube Connected"
                      >
                        <Youtube className="h-3 w-3" />
                        <span>YouTube</span>
                      </div>
                    )}
                    {creator.platforms?.includes("facebook") && (
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 text-[10px] font-semibold"
                        title="Facebook Connected"
                      >
                        <Facebook className="h-3 w-3" />
                        <span>Facebook</span>
                      </div>
                    )}
                  </div>

                  {/* 4-Stat Metric Matrix */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[color:var(--vooki-app-surface-strong)] p-3 border border-[color:var(--vooki-app-border)]/60 text-center">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] block">
                        Audience
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-[color:var(--vooki-app-text-strong)] mt-0.5">
                        {formatCompact(creator.followers)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] block">
                        Engage
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-emerald-500 mt-0.5">
                        {creator.engagementRate > 0 ? `${creator.engagementRate}%` : "—"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] block">
                        Avg Views
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-[color:var(--vooki-app-text-strong)] mt-0.5">
                        {formatCompact(creator.avgViews)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-3 border-t border-[color:var(--vooki-app-border-strong)] flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 h-9 rounded-xl border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-strong)] text-xs font-bold text-[color:var(--vooki-app-text-strong)] shadow-none"
                  >
                    <Link href={`/brand/discover/${creator.id}`} onClick={recordScrollPosition}>
                      View Profile <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>

                  <CreateInviteModal
                    campaignId={inviteCampaignId}
                    campaignName={campaigns.find((c) => c.id === inviteCampaignId)?.name || ""}
                    campaigns={campaigns}
                    preselectedInfluencerId={creator.id}
                    onSuccess={fetchSentInvites}
                    trigger={
                      <Button
                        disabled={hasPendingInvite}
                        className="flex-1 h-9 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {hasPendingInvite ? "Pending" : "Invite"}
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div className="space-y-3">
          {filteredCreators.map((creator) => {
            const saved = shortlist.includes(creator.id);
            const isSaving = shortlistBusyIds.includes(creator.id);
            const hasPendingInvite = sentInvites.some(
              (invite) => invite.influencerId === creator.id && invite.status === "pending"
            );

            return (
              <div
                key={creator.id}
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-4 sm:p-5 transition-all duration-200 hover:border-[color:var(--vooki-app-active-border)] hover:shadow-xs"
              >
                {/* Identity Column */}
                <div className="flex items-center gap-3.5 min-w-0 w-full md:w-1/3">
                  <Link
                    href={`/brand/discover/${creator.id}`}
                    onClick={recordScrollPosition}
                    className="relative shrink-0"
                  >
                    <Avatar className="h-11 w-11 rounded-full border border-[color:var(--vooki-app-border)]">
                      <AvatarImage
                        src={creator.avatar}
                        alt={creator.name}
                        className="object-cover rounded-full"
                      />
                      <AvatarFallback className="bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] font-extrabold text-xs rounded-full">
                        {getInitials(creator.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/brand/discover/${creator.id}`}
                        onClick={recordScrollPosition}
                        className="font-extrabold text-sm text-[color:var(--vooki-app-text-strong)] group-hover:text-[color:var(--vooki-accent)] transition-colors truncate"
                      >
                        {creator.name}
                      </Link>
                      {creator.verified && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[color:var(--vooki-app-text-soft)] truncate">
                      {creator.handle} • {creator.niche}
                    </p>
                  </div>
                </div>

                {/* Metrics Matrix Row */}
                <div className="grid grid-cols-4 gap-3 text-center flex-1 w-full bg-[color:var(--vooki-app-surface-strong)]/40 p-2.5 rounded-xl border border-[color:var(--vooki-app-border)]/40">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] block">
                      Audience
                    </span>
                    <p className="text-xs font-extrabold text-[color:var(--vooki-app-text-strong)]">
                      {formatCompact(creator.followers)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] block">
                      Engage
                    </span>
                    <p className="text-xs font-extrabold text-emerald-500">
                      {creator.engagementRate > 0 ? `${creator.engagementRate}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] block">
                      Avg Views
                    </span>
                    <p className="text-xs font-extrabold text-[color:var(--vooki-app-text-strong)]">
                      {formatCompact(creator.avgViews)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)] block">
                      Est. CPV
                    </span>
                    <p className="text-xs font-extrabold text-[color:var(--vooki-app-text-strong)]">
                      {creator.estCpv > 0 ? `₹${creator.estCpv}` : "—"}
                    </p>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-end gap-2 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => toggleShortlist(creator.id)}
                    disabled={isSaving}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      saved
                        ? "bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] shadow-xs"
                        : "bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-soft)] border border-[color:var(--vooki-app-border)] hover:text-[color:var(--vooki-app-text-strong)]"
                    }`}
                    title={saved ? "Remove from saved" : "Save creator"}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : saved ? (
                      <Bookmark className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <BookmarkPlus className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-9 rounded-xl border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-xs font-bold px-3"
                  >
                    <Link href={`/brand/discover/${creator.id}`} onClick={recordScrollPosition}>
                      Profile <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </Button>

                  <CreateInviteModal
                    campaignId={inviteCampaignId}
                    campaignName={campaigns.find((c) => c.id === inviteCampaignId)?.name || ""}
                    campaigns={campaigns}
                    preselectedInfluencerId={creator.id}
                    onSuccess={fetchSentInvites}
                    trigger={
                      <Button
                        disabled={hasPendingInvite}
                        className="h-9 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] hover:bg-[color:var(--vooki-app-text)] text-xs font-bold px-4 cursor-pointer disabled:opacity-50"
                      >
                        {hasPendingInvite ? "Pending" : "Invite"}
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

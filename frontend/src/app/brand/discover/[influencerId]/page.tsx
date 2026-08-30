"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorProfileView, CampaignOption } from "@/components/creator-profile";

type CampaignListResponse = {
  items?: CampaignOption[];
};

export default function DiscoverProfilePage() {
  const params = useParams<{ influencerId: string }>();
  const influencerId = params?.influencerId;
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);

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
        const items = Array.isArray(data.items) ? data.items : [];
        setCampaigns(items);
      } catch {
        // Ignore campaign loading failures here.
      }
    };

    loadCampaigns();
    return () => controller.abort();
  }, []);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/brand/discover");
    }
  };

  return (
    <div className="w-full">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 -mb-2 sm:-mb-4 relative z-10">
        <div className="mx-auto w-full max-w-5xl">
          <Button
            onClick={handleBack}
            variant="outline"
            className="h-9 rounded-full border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-strong)] hover:border-[color:var(--vooki-accent)] transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to discover
          </Button>
        </div>
      </div>

      <CreatorProfileView
        creatorId={influencerId}
        viewMode="brand"
        showNavbar={false}
        campaigns={campaigns}
        onBack={handleBack}
      />
    </div>
  );
}
import React from "react";

export interface StatsPlatform {
  platform: string;
  lastSynced?: string;
  engagementRate?: number;
  profile?: {
    channelId?: string;
    title?: string;
    customUrl?: string;
    avatarUrl?: string;
  };
  metrics?: {
    subscribers?: number;
    followers?: number;
    totalViews?: number;
    videoCount?: number;
    likes?: number;
    comments?: number;
    hiddenSubscriberCount?: boolean;
    engagementRate?: number;
    [key: string]: any;
  };
}

export interface FeaturedItem {
  _id?: string;
  url: string;
  createdAt?: string;
}

export interface PublicCollaboration {
  brandName: string;
  isVerified?: boolean;
  campaignTitle: string;
  date: string;
}

export interface PublicReview {
  brandName: string;
  rating?: number;
  score?: number;
  review: string;
  date: string;
}

export interface PublicProfileData {
  _id?: string;
  id?: string;
  name: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
  rating?: number;
  totalReviews?: number;
  profile: {
    followers?: number;
    niche?: string;
    location?: string;
    summary?: string;
    highlight?: string;
    audience?: string;
    engagement?: number;
    engagementRate?: number;
    engagementBreakdown?: {
      youtube?: number | null;
      instagram?: number | null;
      facebook?: number | null;
      twitter?: number | null;
      [key: string]: number | null | undefined;
    };
    languages?: string[];
    socialLinks?: Record<string, string>;
    featuredContent?: FeaturedItem[];
    stats?: {
      youtube?: StatsPlatform;
      instagram?: StatsPlatform;
      facebook?: StatsPlatform;
      twitter?: StatsPlatform;
      [key: string]: StatsPlatform | undefined;
    };
    collaborations?: PublicCollaboration[];
    reviews?: PublicReview[];
  };
}


export type CreatorViewMode = "public" | "brand" | "influencer";

export type SectionTab = "overview" | "analytics" | "portfolio" | "partnerships";

export interface CampaignOption {
  id: string;
  name: string;
}

export interface CreatorProfileViewProps {
  /**
   * MongoDB _id or username of the creator.
   * If provided and initialData is not given, CreatorProfileView will fetch the data.
   */
  creatorId?: string;

  /**
   * Directly pass profile data if already fetched by parent page.
   */
  initialData?: PublicProfileData | null;

  /**
   * Perspective of the viewer:
   * - "public": Standard media kit with public top navbar, "Work With Me" inquiry button, share, theme toggle.
   * - "brand": Shows brand-oriented actions like "Invite to Campaign", "Message", back to discover button.
   * - "influencer": Shows creator-oriented actions like "Edit Profile", "Preview", copy profile link.
   * @default "public"
   */
  viewMode?: CreatorViewMode;

  /**
   * Whether to show the public top navbar.
   * @default true in "public" mode, false in "brand" or "influencer" mode
   */
  showNavbar?: boolean;

  /**
   * Optional custom action buttons slot to render in the header instead of default buttons.
   */
  customActions?: React.ReactNode;

  /**
   * Available campaigns list for brand view invite modal.
   */
  campaigns?: CampaignOption[];

  /**
   * Callback fired when a brand sends an invite successfully.
   */
  onInviteSuccess?: () => void;

  /**
   * Optional callback when "Back" button is clicked.
   */
  onBack?: () => void;

  /**
   * Optional custom CSS classes for the container.
   */
  className?: string;
}


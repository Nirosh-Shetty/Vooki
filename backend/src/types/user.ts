import { Types, Document } from "mongoose";

export interface OAuthProvider {
  provider: "local" | "google" | "facebook";
  providerUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: Date | null;
}

export interface StatsConnection {
  platform: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date | null;
  lastSynced?: Date | null;
  profile?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

export type SocialConnection = StatsConnection;

export interface FeaturedContentItem {
  _id: Types.ObjectId;
  url: string;
  createdAt?: Date;
}

export interface InfluencerProfile {
  followers?: number;
  niche?: string;
  socialLinks?: Map<string, string> | Record<string, string>;
  statsConnection?: Map<string, StatsConnection> | Record<string, StatsConnection>;
  collaborations?: Types.ObjectId[];
  summary?: string;
  highlight?: string;
  audience?: string;
  engagement?: number;
  bio?: string;
  genre?: string[];
  earningsSnapshot?: {
    fromYoutube?: number;
    fromInstagram?: number;
    lastUpdated?: Date;
  };
  pricing?: {
    reel?: number;
    story?: number;
    youtubeIntegration?: number;
  };
  languages?: string[];
  location?: string;
  featuredContent?: FeaturedContentItem[];
  preferences?: {
    minimumRate?: {
      amount: number;
      currency: string;
    };
    contentBoundaries?: string;
  };
}

export interface BrandProfile {
  companyName?: string;
  website?: string;
  brandCategory?: string;
  collaborations?: Types.ObjectId[];
  summary?: string;
  activeCampaigns?: number;
  pointsOfContact?: number;
  contactRole?: string;
  collaborationDefaults?: {
    usageRights?: string;
    revisions?: number;
    exclusivityPeriod?: number;
  };
  about?: string;
  preferredCategories?: string[];
  whitelist?: Types.ObjectId[];
}

export interface ManagerProfile {
  companyName?: string;
  teamSize?: number;
  creatorIds?: Types.ObjectId[];
  summary?: string;
  agencyName?: string;
  commissionRate?: number;
  managedInfluencers?: Types.ObjectId[];
}

export interface LoginMetadata {
  ip: string;
  userAgent?: string;
  time: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  phone?: number;
  password?: string;
  role: "influencer" | "brand" | "manager";
  avatar?: string;
  isPremium?: boolean;
  jwtVersion?: number;
  statsConnection?: Map<string, StatsConnection> | Record<string, StatsConnection>;
  oauthProviders?: OAuthProvider[];
  rating: number;
  totalReviews: number;
  influencerProfile?: InfluencerProfile;
  brandDetails?: BrandProfile;
  managerProfile?: ManagerProfile;
  isVerified: boolean;
  reservationExpiresAt?: Date;
  isTempAccount?: boolean;
  otp?: string;
  lastOtpSentAt?: Date;
  loginHistory: LoginMetadata[];
  notificationPreferences?: {
    newCollabInvites: boolean;
    messageNotifications: boolean;
    marketingUpdates: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
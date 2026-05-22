import { Types, Document } from "mongoose";

export interface SocialConnectionBase {
  platform: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  lastSynced?: Date;
}

export interface YoutubeSocialConnection extends SocialConnectionBase {
  platform: "youtube";
  profile?: {
    channelId?: string;
    title?: string;
    customUrl?: string;
    avatarUrl?: string;
  };
  metrics?: {
    subscribers?: number;
    totalViews?: number;
    videoCount?: number;
    commentCount?: number;
    hiddenSubscriberCount?: boolean;
  };
}

export interface InstagramSocialConnection extends SocialConnectionBase {
  platform: "instagram";
  profile?: {
    instagramId?: string;
    username?: string;
    profilePicture?: string;
    pageId?: string;
    pageName?: string;
  };
  metrics?: {
    followers?: number;
    mediaCount?: number;
    reach?: number;
    impressions?: number;
  };
}

export interface GenericSocialConnection extends SocialConnectionBase {
  profile?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

export type SocialConnection =
  | YoutubeSocialConnection
  | InstagramSocialConnection
  | GenericSocialConnection;

export interface LoginMetadata {
  ip: string;
  userAgent?: string; // Optional because some requests may not send it
  time: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  phone: number;
  password: string;
  role: "influencer" | "brand" | "manager";
  profilePicture?: string;
  // isGoogleLinked?: boolean;
  // isFacebookLinked?: boolean;
  rating: number;
  totalReviews: number;
  linkedAccounts?: string[]; // ["google", "facebook", "local"]
  // authProvider: "local" | "google" | "facebook";
  googleId?: string;
  facebookId?: string;
  influencerDetails?: {
    followers?: number;
    niche?: string;
    socialLinks?: Map<string, string> | Record<string, string>;
    socialConnections?: Map<string, SocialConnection> | Record<string, SocialConnection>;
    collaborations?: Types.ObjectId[];
    summary?: string;
    highlight?: string;
    audience?: string;
    engagement?: number;
  };
  brandDetails?: {
    companyName?: string;
    website?: string;
    brandCategory?: string;
    collaborations?: Types.ObjectId[];
    summary?: string;
    activeCampaigns?: number;
    pointsOfContact?: number;
  };
  isVerified: boolean;
  reservationExpiresAt?: Date;
  isTempAccount?: boolean;
  otp?: string;
  lastOtpSentAt?: Date;
  loginHistory: LoginMetadata[];
}

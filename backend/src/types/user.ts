
import { Types, Document } from "mongoose";

export interface OAuthProvider {
  provider: "google" | "facebook";
  providerUserId: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: Date;
}

export interface StatsConnection {
  youtube?: {
    channelId?: string;
    connected?: boolean;
    lastSynced?: Date;
    basicStats?: {
      subscribers?: number;
      views?: number;
      videos?: number;
    };
  };
  instagram?: {
    accountId?: string;
    connected?: boolean;
    lastSynced?: Date;
    basicStats?: {
      followers?: number;
      engagementRate?: number;
    };
  };
}

export interface LoginMetadata {
  ip: string;
  userAgent?: string;
  time: Date;
}

export interface InfluencerProfile {
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
}

export interface BrandProfile {
  companyName?: string;
  website?: string;
  about?: string;
  preferredCategories?: string[];
  whitelist?: Types.ObjectId[];
}

export interface ManagerProfile {
  agencyName?: string;
  commissionRate?: number;
  managedInfluencers?: Types.ObjectId[];
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  username: string;
  phone?: number;
  password: string;
  avatar?: string;
  role: "influencer" | "brand" | "manager";
  oauthProviders?: OAuthProvider[];
  isPremium?: boolean;
  jwtVersion?: number;
  statsConnection?: StatsConnection;
  influencerProfile?: InfluencerProfile;
  brandProfile?: BrandProfile;
  managerProfile?: ManagerProfile;
  isVerified?: boolean;
  reservationExpiresAt?: Date;
  isTempAccount?: boolean;
  otp?: string;
  lastOtpSentAt?: Date;
  loginHistory: LoginMetadata[];
  createdAt?: Date;
  updatedAt?: Date;
}
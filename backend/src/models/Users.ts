import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/user";

const LoginMetadataSchema = new Schema(
  {
    ip: { type: String, required: true },
    userAgent: { type: String },
    time: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const OAuthProviderSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      required: true,
    },
    providerUserId: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    accessTokenExpires: { type: Date, default: null },
  },
  { _id: false }
);

const StatsConnectionSchema = new Schema(
  {
    platform: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    expiresAt: { type: Date, default: null },
    lastSynced: { type: Date, default: null },
    profile: { type: Schema.Types.Mixed, default: {} },
    metrics: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const InfluencerProfileSchema = new Schema(
  {
    followers: { type: Number, default: 0 },
    niche: { type: String },
    socialLinks: { type: Map, of: String },
    statsConnection: {
      type: Map,
      of: StatsConnectionSchema,
      default: {},
    },
    summary: { type: String },
    highlight: { type: String },
    audience: { type: String },
    engagement: { type: Number, default: 0 },
    collaborations: [{ type: Schema.Types.ObjectId, ref: "Collaboration" }],
  },
  { _id: false }
);

const BrandProfileSchema = new Schema(
  {
    companyName: { type: String },
    website: { type: String },
    brandCategory: { type: String },
    summary: { type: String },
    collaborations: [{ type: Schema.Types.ObjectId, ref: "Collaboration" }],
    activeCampaigns: { type: Number, default: 0 },
    pointsOfContact: { type: Number, default: 0 },
    contactRole: { type: String },
    collaborationDefaults: {
      usageRights: { type: String },
      revisions: { type: Number },
      exclusivityPeriod: { type: Number },
    },
  },
  { _id: false }
);

const ManagerProfileSchema = new Schema(
  {
    companyName: { type: String },
    teamSize: { type: Number, default: 0 },
    creatorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    summary: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/.+\@.+\..+/, "Enter a valid email"],
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Username is required"],
    },
    phone: {
      type: Number,
      unique: true,
      sparse: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["influencer", "brand", "manager"],
      required: true,
    },
    avatar: { type: String, default: "" },
    isPremium: { type: Boolean, default: false },
    jwtVersion: { type: Number, default: 1 },
    statsConnection: {
      type: Map,
      of: StatsConnectionSchema,
      default: {},
    },
    oauthProviders: [OAuthProviderSchema],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    influencerProfile: { type: InfluencerProfileSchema, default: {} },
    brandProfile: { type: BrandProfileSchema, default: {} },
    managerProfile: { type: ManagerProfileSchema, default: {} },
    influencerDetails: { type: InfluencerProfileSchema, default: {} },
    brandDetails: { type: BrandProfileSchema, default: {} },
    isVerified: { type: Boolean, default: false },
    reservationExpiresAt: { type: Date, default: null },
    isTempAccount: { type: Boolean, default: false },
    otp: {
      type: String,
      match: [/^\d{6}$/, "OTP must be a 6-digit number"],
    },
    lastOtpSentAt: Date,
    loginHistory: [LoginMetadataSchema],
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", function (next) {
  if (this.username) {
    this.username = this.username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
  }

  if (this.loginHistory?.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }

  next();
});

const UserModel =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default UserModel;
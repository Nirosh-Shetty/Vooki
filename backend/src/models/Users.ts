
import mongoose, { Schema, model, Types, Document } from "mongoose";

// OAuth provider sub-schema
const OAuthProviderSchema = new Schema({
  provider: { type: String, enum: ["google", "facebook"]},
  providerUserId: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  accessTokenExpires: { type: Date }
}, { _id: false });

// Stats connection sub-schema
const StatsConnectionSchema = new Schema({
  youtube: {
    channelId: String,
    connected: { type: Boolean, default: false },
    lastSynced: Date,
    basicStats: {
      subscribers: Number,
      views: Number,
      videos: Number
    }
  },
  instagram: {
    accountId: String,
    connected: { type: Boolean, default: false },
    lastSynced: Date,
    basicStats: {
      followers: Number,
      engagementRate: Number
    }
  }
}, { _id: false });

// Login metadata sub-schema
const LoginMetadataSchema = new Schema({
  ip: { type: String, required: true },
  userAgent: { type: String },
  time: { type: Date, required: true, default: Date.now },
}, { _id: false });

const UserSchema = new Schema({
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
    select: false
  },
  avatar: { type: String },
  role: {
    type: String,
    enum: ["influencer", "brand", "manager"],
    required: true
  },
  // OAuth providers
  oauthProviders: {
    type: [OAuthProviderSchema],
    default: []
  },
  // platform-level metadata
  isPremium: { type: Boolean, default: false },
  jwtVersion: { type: Number, default: 0 },
  // stats & API-connection
  statsConnection: StatsConnectionSchema,
  // influencer-specific
  influencerProfile: {
    bio: String,
    genre: [String],
    earningsSnapshot: {
      fromYoutube: Number,
      fromInstagram: Number,
      lastUpdated: Date
    },
    pricing: {
      reel: Number,
      story: Number,
      youtubeIntegration: Number
    }
  },
  // brand-specific
  brandProfile: {
    companyName: String,
    website: String,
    about: String,
    collaborations: [{ type: Schema.Types.ObjectId, ref: "Collaboration" }],
    activeCampaigns: { type: Number, default: 0 },
    pointsOfContact: { type: Number, default: 0 },
    preferredCategories: [String],
    whitelist: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  // manager-specific
  managerProfile: {
    agencyName: String,
    commissionRate: Number,
    managedInfluencers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  // legacy/extra fields
  isVerified: { type: Boolean, default: false },
  reservationExpiresAt: { type: Date, default: null },
  isTempAccount: { type: Boolean, default: false },
  otp: {
    type: String,
    match: [/^\d{6}$/, "OTP must be a 6-digit number"],
  },
  lastOtpSentAt: Date,
  loginHistory: [LoginMetadataSchema],
}, { timestamps: true });

// Clean username
UserSchema.pre("save", function (next) {
  if (this.username) {
    this.username = this.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  }
  next();
});
// Limit login history to last 10 entries
UserSchema.pre("save", function (next) {
  if (this.loginHistory?.length > 10) {
    this.loginHistory.splice(0, this.loginHistory.length - 10);
  }
  next();
});

const UserModel = (mongoose.models.User as mongoose.Model<any>) || mongoose.model("User", UserSchema);
export default UserModel;
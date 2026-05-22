import mongoose, { Schema, model, Types, Document } from "mongoose";
import { IUser } from "../types/user";

const LoginMetadataSchema = new Schema(
  {
    ip: { type: String, required: true },
    userAgent: { type: String },
    time: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const SocialConnectionSchema = new Schema(
  {
    platform: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    expiresAt: { type: Date },
    lastSynced: { type: Date },
    profile: { type: Schema.Types.Mixed, default: {} },
    metrics: { type: Schema.Types.Mixed, default: {} },
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
      // required: [true, "Phone number is required"]
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    password: {
      type: String,
      select: false,
    },

    googleId: String,
    facebookId: String,

    linkedAccounts: {
      type: [String],
      enum: ["local", "google", "facebook"],
      default: [],
    },

    role: {
      type: String,
      enum: ["influencer", "brand", "manager"],
      required: true,
    },

    profilePicture: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    influencerDetails: {
      type: {
        followers: { type: Number, default: 0 },
        niche: { type: String },
        socialLinks: { type: Map, of: String },
        socialConnections: {
          type: Map,
          of: SocialConnectionSchema,
          default: {},
        },
        summary: { type: String },
        highlight: { type: String },
        audience: { type: String },
        engagement: { type: Number, default: 0 },
        collaborations: [{ type: Schema.Types.ObjectId, ref: "Collaboration" }],
      },
      required: false,
    },

    brandDetails: {
      type: {
        companyName: { type: String },
        website: { type: String },
        brandCategory: { type: String },
        summary: { type: String },
        collaborations: [{ type: Schema.Types.ObjectId, ref: "Collaboration" }],
        activeCampaigns: { type: Number, default: 0 },
        pointsOfContact: { type: Number, default: 0 },
      },
      required: false,
    },

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

// ✅ Hook to clean username
// UserSchema.pre("save", function (next) {
//   if (this.username) {
//     this.username = this.username
//       .trim()
//       .toLowerCase()
//       .replace(/[^a-z0-9_]/g, "_");
//   }
//   next();
// });

// ✅ Hook to limit login history to last 10 entries
UserSchema.pre("save", function (next) {
  if (this.loginHistory?.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }
  next();
});

const UserModel =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default UserModel;

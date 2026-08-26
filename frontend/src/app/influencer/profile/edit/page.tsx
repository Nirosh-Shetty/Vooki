"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Camera,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type InfluencerFormState = {
  name: string;
  username: string;
  email: string;
  phone: string;
  location: string;
  languages: string;
  niche: string;
  followers: string;
  highlight: string;
  bio: string;
  audience: string;
  engagement: string;
};

const emptyForm: InfluencerFormState = {
  name: "",
  username: "",
  email: "",
  phone: "",
  location: "",
  languages: "",
  niche: "",
  followers: "",
  highlight: "",
  bio: "",
  audience: "",
  engagement: "",
};

// Client-side image compression to prevent 413 Payload Too Large
const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image file"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

const parseOptionalNumber = (value: string | undefined | null): number | undefined => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  const number = Number(trimmed);
  return Number.isNaN(number) ? undefined : number;
};

export default function influencerDetailsEditPage() {
  const [form, setForm] = useState<InfluencerFormState>(emptyForm);
  const [initialUsername, setInitialUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Unable to load profile");
        const data = await response.json();
        if (data.role !== "influencer") throw new Error("Expected influencer account");

        const details = data.influencerDetails ?? {};
        const fetchedUsername = String(data.username ?? "");

        setInitialUsername(fetchedUsername);
        setForm({
          name: String(data.name ?? ""),
          username: fetchedUsername,
          email: String(data.email ?? ""),
          phone: String(data.phone ?? ""),
          location: String(details.location ?? ""),
          languages: Array.isArray(details.languages)
            ? details.languages.join(", ")
            : String(details.languages ?? ""),
          niche: String(details.niche ?? ""),
          followers: String(details.followers ?? ""),
          highlight: String(details.highlight ?? ""),
          bio: String(details.bio ?? details.summary ?? ""),
          audience: String(details.audience ?? ""),
          engagement: String(details.engagement ?? ""),
        });

        if (data.avatar) {
          setPhotoPreview(String(data.avatar));
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error loading influencer profile:", error);
        setStatus({ type: "error", message: "Unable to load your profile. Try refreshing." });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    return () => controller.abort();
  }, []);

  // Debounced username availability checker
  useEffect(() => {
    const trimmed = form.username.trim();

    if (!trimmed || trimmed === initialUsername) {
      setIsCheckingUsername(false);
      setIsUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    setIsUsernameAvailable(null);

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/influencer/check-username/${encodeURIComponent(trimmed)}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );
        const data = await res.json();
        setIsUsernameAvailable(Boolean(data.available));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setIsUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form.username, initialUsername]);

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!String(form.name ?? "").trim()) missing.push("Full Name");
    if (!String(form.username ?? "").trim()) missing.push("Username");
    if (!String(form.location ?? "").trim()) missing.push("Location");
    if (!String(form.niche ?? "").trim()) missing.push("Niche");
    return missing;
  }, [form.name, form.username, form.location, form.niche]);

  const readyToSave =
    missingFields.length === 0 && isUsernameAvailable !== false && !isCheckingUsername;

  const handleFieldChange = (field: keyof InfluencerFormState, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setPhotoPreview(dataUrl);
      setPhotoData(dataUrl);
    } catch (err) {
      console.error("Image processing error:", err);
      setStatus({ type: "error", message: "Could not process selected image." });
    }
  };

  const handleSubmit = async () => {
    if (!readyToSave) {
      if (isUsernameAvailable === false) {
        setStatus({ type: "error", message: "The chosen username is already taken." });
        return;
      }
      setStatus({
        type: "error",
        message: `Please complete required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const data = {
        name: String(form.name ?? "").trim(),
        username: String(form.username ?? "").trim(),
        email: String(form.email ?? "")
          .trim()
          .toLowerCase(),
        phone: String(form.phone ?? "").trim(),
        influencerDetails: {
          location: String(form.location ?? "").trim(),
          languages: String(form.languages ?? "")
            .split(",")
            .map((language) => language.trim())
            .filter(Boolean),
          niche: String(form.niche ?? "").trim(),
          followers: parseOptionalNumber(form.followers),
          highlight: String(form.highlight ?? "").trim(),
          bio: String(form.bio ?? "").trim(),
          summary: String(form.bio ?? "").trim(),
          audience: String(form.audience ?? "").trim(),
          engagement: parseOptionalNumber(form.engagement),
        },
        photo: photoData || undefined,
      };

      const payload = {name : data.name, username: data.username, email: data.email, phone: data.phone, influencerDetails: data.influencerDetails, photo: data.photo}

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/influencer`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Server responded with status ${response.status}`);
      }

      setInitialUsername(form.username.trim());
      setIsUsernameAvailable(null);
      setStatus({ type: "success", message: "Profile details updated successfully!" });
      setPhotoData(null);
    } catch (error) {
      console.error("Error updating influencer profile:", error);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Couldn't save your profile. Try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const parsedLanguages = useMemo(() => {
    return form.languages
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
  }, [form.languages]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[500px] w-full max-w-4xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[color:var(--vooki-app-active-icon)]" />
          <p className="text-xs sm:text-sm font-medium text-[color:var(--vooki-app-text-soft)]">
            Loading profile information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 sm:px-6 py-4 sm:py-8">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-[color:var(--vooki-app-border-strong)] shadow-xs bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-strong)]"
          >
            <Link href="/influencer/profile">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
              Edit Media Kit
            </h1>
            <p className="text-xs text-[color:var(--vooki-app-text-soft)]">
              Update your public creator profile and pitch details.
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-[color:var(--vooki-app-border-strong)] text-xs text-[color:var(--vooki-app-text-soft)] bg-[color:var(--vooki-app-surface-strong)]"
        >
          <Sparkles className="h-3 w-3 text-[color:var(--vooki-app-active-icon)]" />
          Public Media Kit
        </Badge>
      </div>

      {/* Main Edit Form Container */}
      <div className="space-y-6">
        {/* Section 1: Basic Identity & Avatar */}
        <Card className="rounded-2xl sm:rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3 border-b border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)]/40">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-[color:var(--vooki-app-active-icon)]" />
              Creator Identity
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Avatar Uploader */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
              <div className="relative group mx-auto sm:mx-0">
                <Avatar className="h-20 w-20 rounded-full border-2 border-background shadow-md">
                  <AvatarImage src={photoPreview} className="object-cover" />
                  <AvatarFallback className="font-bold text-lg bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)]">
                    {String(form.name ?? "")
                      .trim()
                      .substring(0, 2)
                      .toUpperCase() || "CR"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col items-center sm:items-start gap-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] px-3.5 py-2 text-xs font-semibold text-[color:var(--vooki-app-text-strong)] transition-all shadow-xs hover:bg-[color:var(--vooki-app-surface-strong)]">
                    <Camera className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                    Upload Profile Picture
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-[color:var(--vooki-app-text-subtle)] text-center sm:text-left">
                  Supports JPG, PNG or WEBP. Automatically resized & compressed.
                </p>
              </div>
            </div>

            {/* Inputs: Name, Handle, Niche, Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)]">
                  Full Name *
                </label>
                <Input
                  className="rounded-xl bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border-strong)]"
                  value={form.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="e.g. Nirosh Shetty"
                />
              </div>

              {/* Username Input with Validation Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)]">
                  Creator Handle / Username *
                </label>
                <div className="relative">
                  <Input
                    className={`rounded-xl bg-[color:var(--vooki-app-surface-strong)] pr-9 transition-colors ${isUsernameAvailable === false
                        ? "border-red-500 focus-visible:ring-red-500"
                        : isUsernameAvailable === true
                          ? "border-emerald-500 focus-visible:ring-emerald-500"
                          : "border-[color:var(--vooki-app-border-strong)]"
                      }`}
                    value={form.username}
                    onChange={(e) => handleFieldChange("username", e.target.value)}
                    placeholder="creator_nirosh"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isCheckingUsername && (
                      <Loader2 className="h-4 w-4 animate-spin text-[color:var(--vooki-app-text-soft)]" />
                    )}
                    {!isCheckingUsername && isUsernameAvailable === true && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                    )}
                    {!isCheckingUsername && isUsernameAvailable === false && (
                      <XCircle className="h-4 w-4 text-red-500 stroke-[2.5]" />
                    )}
                  </div>
                </div>

                {!isCheckingUsername && isUsernameAvailable === false && (
                  <p className="text-[11px] font-medium text-red-500">
                    This username is already taken.
                  </p>
                )}
                {!isCheckingUsername && isUsernameAvailable === true && (
                  <p className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 inline" /> Username is available!
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                  Niche *
                </label>
                <Input
                  className="rounded-xl bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border-strong)]"
                  value={form.niche}
                  onChange={(e) => handleFieldChange("niche", e.target.value)}
                  placeholder="e.g. Tech & AI, Fashion, Gaming"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                  Location *
                </label>
                <Input
                  className="rounded-xl bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border-strong)]"
                  value={form.location}
                  onChange={(e) => handleFieldChange("location", e.target.value)}
                  placeholder="e.g. Bangalore, India"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Pitch & Highlights */}
        <Card className="rounded-2xl sm:rounded-3xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3 border-b border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)]/40">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[color:var(--vooki-app-active-icon)]" />
              Pitch & Highlights
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)]">
                  Key Highlight / One-Liner Pitch
                </label>
                <span className="text-[10px] text-[color:var(--vooki-app-text-subtle)]">
                  Shows as banner in About
                </span>
              </div>
              <Input
                className="rounded-xl bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border-strong)]"
                value={form.highlight}
                onChange={(e) => handleFieldChange("highlight", e.target.value)}
                placeholder="e.g. Over 150+ in-depth product breakdowns with an average 12% engagement rate"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-soft)] flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-[color:var(--vooki-app-active-icon)]" />
                  Spoken Languages
                </label>
                <Input
                  className="rounded-xl bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border-strong)]"
                  value={form.languages}
                  onChange={(e) => handleFieldChange("languages", e.target.value)}
                  placeholder="e.g. English, Hindi, Kannada"
                />
                {parsedLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {parsedLanguages.map((lang, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-[10px] bg-[color:var(--vooki-app-surface-strong)] border border-[color:var(--vooki-app-border-strong)]"
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Dock */}
      <div className="sticky bottom-4 z-40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)]/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 sm:flex-none rounded-xl border border-[color:var(--vooki-app-active-border)] bg-[color:var(--vooki-app-active-bg)] text-[color:var(--vooki-app-active-text)] hover:bg-[color:var(--vooki-app-active-border)] text-xs sm:text-sm font-semibold h-10 px-5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            disabled={loading || saving || !readyToSave}
            onClick={handleSubmit}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Profile
              </>
            )}
          </Button>

          <Button
            variant="outline"
            asChild
            disabled={saving}
            className="rounded-xl text-xs sm:text-sm font-medium h-10 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] hover:bg-[color:var(--vooki-app-surface-strong)]"
          >
            <Link href="/influencer/profile">Cancel</Link>
          </Button>
        </div>

        {/* Validation / Submission Feedback */}
        <div className="flex items-center gap-2 text-xs">
          {!readyToSave && (
            <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {isUsernameAvailable === false
                ? "Username unavailable"
                : isCheckingUsername
                  ? "Verifying username..."
                  : `Missing: ${missingFields.join(", ")}`}
            </span>
          )}

          {status && (
            <span
              className={`flex items-center gap-1.5 font-medium ${status.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : status.type === "error"
                    ? "text-red-500"
                    : "text-[color:var(--vooki-app-text-strong)]"
                }`}
            >
              {status.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
              {status.type === "error" && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
              {status.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


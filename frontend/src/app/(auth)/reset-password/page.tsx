/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/schemas/forgot&resetPassword.schema";
import { z } from "zod";
import axios from "axios";

export default function ResetPassword1Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    register,
    // trigger,
    formState: { isSubmitting, errors },
  } = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({ control, name: "password" });
  const confirmPassword = useWatch({ control, name: "confirmPassword" });

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
  const isPasswordStrong =
    hasMinLength && hasLetter && hasNumber && hasSpecialChar;

  useEffect(() => {
    if (!token) {
      router.replace("/reset-password/result?status=invalid-token");
    }
  }, [token, router]);

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setError("");
    if (!token) {
      setError("Invalid or expired reset link. Please request a new one.");
      return;
    }
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/reset-password`,
        {
          token,
          newPassword: data.password,
        }
      );
      router.replace(`/reset-password/result?status=success`);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorIn = error?.response?.data?.errorIn;
        if (errorIn && errorIn !== "error") {
          router.replace(`/reset-password/result?status=${errorIn}`);
          return;
        }
        setError(error?.response?.data?.message || "Unexpected server error");
      } else {
        setError("Something went wrong. Please try again later.");
      }
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[color:var(--vooki-app-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] rounded-3xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[color:var(--vooki-violet)] to-[color:var(--vooki-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-[color:var(--vooki-app-text-strong)]" />
              </div>
              <h1 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)] mb-2">
                Create New Password
              </h1>
              <p className="text-sm text-[color:var(--vooki-app-text-muted)]">
                Choose a strong password for your account
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[color:var(--vooki-app-text-strong)]">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    {...register("password")}
                    className="bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-strong)] placeholder-[color:var(--vooki-app-text-muted)] pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--vooki-app-text-muted)] hover:text-[color:var(--vooki-app-text-strong)]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* Password strength indicators */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      <div
                        className={`w-1 h-1 rounded-full mr-2 ${
                          hasMinLength ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></div>
                      <span
                        className={
                          hasMinLength ? "text-green-400" : "text-[color:var(--vooki-app-text-muted)]"
                        }
                      >
                        8+ characters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <div
                        className={`w-1 h-1 rounded-full mr-2 ${
                          hasLetter ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></div>
                      <span
                        className={
                          hasLetter ? "text-green-400" : "text-[color:var(--vooki-app-text-muted)]"
                        }
                      >
                        Contains letters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <div
                        className={`w-1 h-1 rounded-full mr-2 ${
                          hasNumber ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></div>
                      <span
                        className={
                          hasNumber ? "text-green-400" : "text-[color:var(--vooki-app-text-muted)]"
                        }
                      >
                        Contains numbers
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <div
                        className={`w-1 h-1 rounded-full mr-2 ${
                          hasSpecialChar ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></div>
                      <span
                        className={
                          hasSpecialChar ? "text-green-400" : "text-[color:var(--vooki-app-text-muted)]"
                        }
                      >
                        Contains symbols
                      </span>
                    </div>
                  </div>
                )}
                {errors?.password && (
                  <p className="text-red-400 text-xs">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[color:var(--vooki-app-text-strong)]">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className="bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-strong)] placeholder-[color:var(--vooki-app-text-muted)] pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--vooki-app-text-muted)] hover:text-[color:var(--vooki-app-text-strong)]"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors?.confirmPassword && (
                  <p className="text-red-400 text-xs">
                    {errors.confirmPassword.message}
                  </p>
                )}
                {password &&
                  confirmPassword &&
                  password !== confirmPassword && (
                    <p className="text-red-400 text-xs">
                      Passwords do not match
                    </p>
                  )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button
                type="submit"
                className="w-full bg-[color:var(--vooki-accent)] hover:bg-[color:var(--vooki-accent-strong)] text-gray-900 shadow-[var(--vooki-shadow-accent)] rounded-full font-medium py-3"
                disabled={
                  isSubmitting ||
                  !isPasswordStrong ||
                  password !== confirmPassword
                }
              >
                {isSubmitting ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

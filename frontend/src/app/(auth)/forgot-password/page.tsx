/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/schemas/forgot&resetPassword.schema";
import type { z } from "zod";

export default function ForgotPassword1Page() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const handleForgotPasswordSubmit = async (
    data: z.infer<typeof forgotPasswordSchema>
  ) => {
    setError("");
    if (!data.email) {
      setError("Please enter your email address");
      return;
    }
    setIsSubmitting(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/forgot-password`,
        { email: data.email },
        { withCredentials: true }
      );

      // keep email for result page fallback
      sessionStorage.setItem("resetEmail", data.email);

      // preferred: pass email in query so result page doesn't rely on sessionStorage
      router.push(
        `/forgot-password/result?email=${encodeURIComponent(data.email)}`
      );
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to send reset link");
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--vooki-app-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] rounded-3xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-center mb-6">
              <Link href="/signin" className="mr-4">
                <ArrowLeftIcon className="h-5 w-5 text-[color:var(--vooki-app-text-muted)] hover:text-[color:var(--vooki-app-text-strong)] transition-colors" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">Reset Password</h1>
                <p className="text-sm text-[color:var(--vooki-app-text-muted)]">
                  We&apos;ll send you a reset link
                </p>
              </div>
            </div>

            {/* Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[color:var(--vooki-violet)] to-[color:var(--vooki-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
                <MailIcon className="h-8 w-8 text-[color:var(--vooki-app-text-strong)]" />
              </div>
              <p className="text-[color:var(--vooki-app-text-soft)] text-sm">
                Enter your email and we&apos;ll send you a link to reset your
                password
              </p>
            </div>

            <form
              className="space-y-6"
              onSubmit={handleSubmit(handleForgotPasswordSubmit)}
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[color:var(--vooki-app-text-strong)]">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email")}
                  className="bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-strong)] placeholder-[color:var(--vooki-app-text-muted)]"
                  required
                />

                {errors?.email?.message ? (
                  <p className="text-red-400 text-xs">{errors.email.message}</p>
                ) : error ? (
                  <p className="text-red-400 text-xs">{error}</p>
                ) : (
                  <p className="text-[color:var(--vooki-app-text-muted)] text-xs">
                    Enter the email associated with your account
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[color:var(--vooki-accent)] hover:bg-[color:var(--vooki-accent-strong)] text-gray-900 shadow-[var(--vooki-shadow-accent)] rounded-full font-medium py-3"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

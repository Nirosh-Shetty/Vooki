"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon } from "lucide-react";

export default function ForgotPassword1ResultPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const RESEND_INTERVAL = 60; // seconds
  const [countdown, setCountdown] = useState(RESEND_INTERVAL);
  const [isResending, setIsResending] = useState(false);

  // Get email from sessionStorage on component mount
  useEffect(() => {
    const resetEmail = sessionStorage.getItem("resetEmail");
    if (!resetEmail) {
      // If no email found, redirect back to forgot password
      router.push("/forgot-password");
      return;
    }
    setEmail(resetEmail);

    // Persist countdown across refreshes
    const lastResend = localStorage.getItem("lastPasswordResetResend");
    if (lastResend) {
      const elapsed = Math.floor((Date.now() - parseInt(lastResend, 10)) / 1000);
      const remaining = RESEND_INTERVAL - elapsed;
      setCountdown(remaining > 0 ? remaining : 0);
    }
  }, [router]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    setIsResending(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/forgot-password`,
        { email },
        { withCredentials: true }
      );

      // Store the resend timestamp
      localStorage.setItem("lastPasswordResetResend", Date.now().toString());
      setCountdown(RESEND_INTERVAL);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const retryAfter = error.response?.data?.retryAfter;
        if (retryAfter) {
          setCountdown(retryAfter);
        }
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleEditEmail = () => {
    // Clear the stored email and go back to form
    sessionStorage.removeItem("resetEmail");
    router.push("/forgot-password");
  };

  return (
    <div className="min-h-screen bg-[color:var(--vooki-app-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircleIcon className="h-8 w-8 text-[color:var(--vooki-app-text-strong)]" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)] mb-2">
                  Check Your Email
                </h2>
                <div className="space-y-2">
                  <p className="text-[color:var(--vooki-app-text-soft)] text-sm">
                    We&apos;ve sent a password reset link to
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-medium text-[color:var(--vooki-app-text-strong)]">{email}</span>
                    <button
                      type="button"
                      onClick={handleEditEmail}
                      className="text-xs text-[color:var(--vooki-accent)] hover:text-[color:var(--vooki-accent-strong)] underline"
                    >
                      Wrong email?
                    </button>
                  </div>
                </div>
                <p className="text-[color:var(--vooki-app-text-muted)] text-xs mt-4">
                  If you don&apos;t see the email, check your spam folder
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/signin")}
                  className="w-full bg-[color:var(--vooki-accent)] hover:bg-[color:var(--vooki-accent-strong)] text-gray-900 shadow-[var(--vooki-shadow-accent)] rounded-full font-medium py-3"
                >
                  Back to Sign In
                </Button>

                <div className="text-center">
                  <p className="text-[color:var(--vooki-app-text-muted)] text-sm mb-2">
                    Didn&apos;t receive the email?
                  </p>
                  {countdown > 0 ? (
                    <p className="text-[color:var(--vooki-app-text-muted)] text-sm">
                      Resend in {countdown}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-sm text-[color:var(--vooki-accent)] hover:text-[color:var(--vooki-accent-strong)] underline disabled:opacity-50"
                    >
                      {isResending ? "Sending..." : "Resend reset link"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

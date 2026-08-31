/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, CheckIcon, XIcon, LoaderIcon, RefreshCwIcon } from "lucide-react"
import Link from "next/link"
import axios from "axios"

export default function DetailsPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [linkedAccounts, setLinkedAccounts] = useState<string[]>([])

  // Get role from sessionStorage
  useEffect(() => {
    const role = sessionStorage.getItem("selectedRole")
    if (!role) {
      router.push("/signup/welcome")
    } else {
      setSelectedRole(role)
    }
  }, [router])

  // Username validation with debounce and backend check
  const lastCheckedUsername = useRef<string | null>(null)

  const checkUsernameAvailability = useCallback(
    async (username: string) => {
      setUsernameStatus("checking")
      lastCheckedUsername.current = username
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/check-username-unique`,
          { username, email: formData.email }
        )
        setUsernameStatus(res?.data?.availability)
        if (res?.data?.availability === "taken") {
          setUsernameSuggestions(res?.data?.suggestions || [])
        } else {
          setUsernameSuggestions([])
        }
      } catch (error: any) {
        console.error("Failed to check username availability")
        setUsernameStatus("idle")
        setErrors((prev) => ({
          ...prev,
          username: error.response?.data?.message || "Error checking username",
        }))
      }
    },
    [formData.email]
  )

  useEffect(() => {
    if (formData.username.length < 3) {
      setUsernameStatus("idle")
      setUsernameSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      if (lastCheckedUsername.current !== formData.username) {
        checkUsernameAvailability(formData.username)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.username, checkUsernameAvailability])

  const generateUsernameSuggestions = (baseUsername: string) => {
    const base = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, "")
    const currentYear = new Date().getFullYear().toString().slice(-2)

    const suggestionTypes = [
      `${base}${Math.floor(10 + Math.random() * 90)}`,
      `${base}_${Math.floor(10 + Math.random() * 90)}`,
      `${base}${currentYear}`,
      `${base}.official`,
      `the_${base}`,
      `${base}_user`,
      `${base}pro`,
      `${base}${Math.floor(100 + Math.random() * 900)}`,
    ]

    // Get 3 random unique suggestions
    const shuffled = suggestionTypes.sort(() => 0.5 - Math.random())
    setUsernameSuggestions(shuffled.slice(0, 3))
  }

  const generateNewSuggestions = () => {
    generateUsernameSuggestions(formData.username)
  }

  const selectSuggestion = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, username: suggestion }))
    setUsernameStatus("available")
    setUsernameSuggestions([])

    // Clear any existing username errors
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: "" }))
    }
  }

  // Password strength
  const passwordStrength = {
    hasLength: formData.password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
  }
  const isPasswordValid = Object.values(passwordStrength).every(Boolean)

  // Email validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

  const handleInputChange = (field: string, value: string) => {
    if (field === "username") {
      // Clean username input
      value = value.toLowerCase().replace(/[^a-z0-9._]/g, "")
    }

    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!isEmailValid) newErrors.email = "Please enter a valid email"
    if (usernameStatus !== "available") newErrors.username = "Username not available"
    if (!isPasswordValid) newErrors.password = "Password doesn't meet requirements"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // Call backend to create user
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signup`,
        {
          name: formData.email.split("@")[0], // Use email prefix as name, can be updated later
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: selectedRole,
        },
        {
          withCredentials: true,
        }
      )

      // Store data for verification page
      sessionStorage.setItem(
        "signupData",
        JSON.stringify({
          role: selectedRole,
          ...formData,
        })
      )

      router.push("/signup/verify")
    } catch (error: any) {
      console.error("Signup error:", error)
      const errorMessage = error.response?.data?.message || "An error occurred during signup"
      const errorIn = error.response?.data?.errorIn
      const linkedProviders = error.response?.data?.linkedAccounts || []

      setLinkedAccounts(linkedProviders)

      if (errorIn) {
        setErrors((prev) => ({
          ...prev,
          [errorIn]: errorMessage,
        }))
      } else {
        setErrors((prev) => ({
          ...prev,
          email: errorMessage,
        }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleLabel = () => {
    switch (selectedRole) {
      case "influencer":
        return "Creator"
      case "brand":
        return "Brand"
      case "manager":
        return "Manager"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--vooki-app-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          </div>
        </div>

        <Card className="border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] rounded-3xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-center mb-6">
              <Link href="/signup/welcome" className="mr-4">
                <ArrowLeftIcon className="h-5 w-5 text-[color:var(--vooki-app-text-muted)] hover:text-[color:var(--vooki-app-text-strong)] transition-colors" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[color:var(--vooki-app-text-strong)]">Create Account</h1>
                {selectedRole && <p className="text-sm text-[color:var(--vooki-app-text-muted)]">Signing up as {getRoleLabel()}</p>}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[color:var(--vooki-app-text-strong)]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-strong)] placeholder-[color:var(--vooki-app-text-muted)] ${errors.email ? "border-red-500" : isEmailValid && formData.email ? "border-green-500" : ""
                    }`}
                  required
                />
                {errors.email && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                    <p className="text-red-400 text-xs mb-2">{errors.email}</p>
                    {linkedAccounts.length > 0 && (
                      <div className="text-xs text-red-300">
                        <p className="mb-2">Please sign in with:</p>
                        <div className="flex gap-2">
                          {linkedAccounts.includes("google") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="bg-red-500/20 border-red-500/50 text-red-200 hover:bg-red-500/30 h-7 text-xs"
                              onClick={() => router.push("/signin")}
                            >
                              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24">
                                <path
                                  fill="currentColor"
                                  d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
                                />
                              </svg>
                              Google
                            </Button>
                          )}
                          {/* {linkedAccounts.includes("facebook") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="bg-red-500/20 border-red-500/50 text-red-200 hover:bg-red-500/30 h-7 text-xs"
                              onClick={() => router.push("/signin")}
                            >
                              <svg className="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                              Facebook
                            </Button>
                          )} */}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[color:var(--vooki-app-text-strong)]">
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="@username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className={`bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-strong)] placeholder-[color:var(--vooki-app-text-muted)] pr-10 ${errors.username
                        ? "border-red-500"
                        : usernameStatus === "available"
                          ? "border-green-500"
                          : usernameStatus === "taken"
                            ? "border-red-500"
                            : ""
                      }`}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <LoaderIcon className="h-4 w-4 animate-spin text-[color:var(--vooki-app-text-muted)]" />}
                    {usernameStatus === "available" && <CheckIcon className="h-4 w-4 text-green-500" />}
                    {usernameStatus === "taken" && <XIcon className="h-4 w-4 text-red-500" />}
                  </div>
                </div>

                {usernameStatus === "taken" && usernameSuggestions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-red-400 text-xs mb-2">Try these instead:</p>
                    <div className="flex flex-wrap gap-2">
                      {usernameSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => selectSuggestion(suggestion)}
                          className="bg-[color:var(--vooki-app-surface-strong)] hover:bg-[color:var(--vooki-app-surface-hover)] border-[color:var(--vooki-app-border)] hover:border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-strong)] text-xs px-3 py-1 h-7 rounded-full transition-all duration-200"
                        >
                          @{suggestion}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generateNewSuggestions}
                        className="text-[color:var(--vooki-app-text-muted)] hover:text-[color:var(--vooki-app-text-strong)] bg-transparent hover:bg-[color:var(--vooki-app-surface-hover)] p-1 h-7 w-7 min-w-[28px] rounded-full border-[color:var(--vooki-app-border)] hover:border-[color:var(--vooki-app-border-strong)]"
                        title="Get new suggestions"
                      >
                        <RefreshCwIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {errors.username && <p className="text-red-400 text-xs">{errors.username}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[color:var(--vooki-app-text-strong)]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`bg-[color:var(--vooki-app-surface-strong)] border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-strong)] placeholder-[color:var(--vooki-app-text-muted)] pr-10 ${errors.password
                        ? "border-red-500"
                        : isPasswordValid && formData.password
                          ? "border-green-500"
                          : ""
                      }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--vooki-app-text-muted)] hover:text-[color:var(--vooki-app-text-strong)]"
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>

                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      <div
                        className={`w-1 h-1 rounded-full mr-2 ${passwordStrength.hasLength ? "bg-green-500" : "bg-gray-500"}`}
                      ></div>
                      <span className={passwordStrength.hasLength ? "text-green-400" : "text-[color:var(--vooki-app-text-muted)]"}>
                        8+ characters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <div
                        className={`w-1 h-1 rounded-full mr-2 ${passwordStrength.hasLetter ? "bg-green-500" : "bg-gray-500"}`}
                      ></div>
                      <span className={passwordStrength.hasLetter ? "text-green-400" : "text-[color:var(--vooki-app-text-muted)]"}>
                        Contains letters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <div
                        className={`w-1 h-1 rounded-full mr-2 ${passwordStrength.hasNumber ? "bg-green-500" : "bg-gray-500"}`}
                      ></div>
                      <span className={passwordStrength.hasNumber ? "text-green-400" : "text-[color:var(--vooki-app-text-muted)]"}>
                        Contains numbers
                      </span>
                    </div>
                  </div>
                )}
                {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !isEmailValid || usernameStatus !== "available" || !isPasswordValid}
                className="w-full bg-[color:var(--vooki-accent)] hover:bg-[color:var(--vooki-accent-strong)] text-gray-900 shadow-[var(--vooki-shadow-accent)] rounded-full font-medium py-3"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-xs text-[color:var(--vooki-app-text-muted)] mt-6">
              By continuing, you agree to our Terms & Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

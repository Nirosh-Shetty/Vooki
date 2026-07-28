/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon, UserIcon } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { useAuth } from "@/hooks/useAuth"

export default function Signin1Page() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [linkedAccounts, setLinkedAccounts] = useState<string[]>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.identifier || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signin`,
        {
          identifier: formData.identifier,
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );

      await refreshUser();

      // Expecting role in response: { role: "brand" | "influencer" | "manager" }
      const role = res.data?.user?.role;
      if (role === "brand") router.push("/brand/dashboard");
      else if (role === "influencer") router.push("/influencer/dashboard");
      else if (role === "manager") router.push("/manager/dashboard");
      else router.push("/");
    } catch (error: any) {
      if (error.response?.data?.message) {
        setError(error.response.data.message)
        setLinkedAccounts(error.response?.data?.linkedAccounts || [])
      } else {
        setError("An error occurred. Please try again.")
        setLinkedAccounts([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-300">Sign in to your account</p>
            </div>

            <form className="space-y-6" onSubmit={handleSignIn}>
              {/* Email/Phone/Username */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-white">
                  Email / Phone / Username
                </Label>
                <Input
                  id="identifier"
                  placeholder="Enter your email, phone or username"
                  value={formData.identifier}
                  onChange={(e) => handleInputChange("identifier", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  required
                />
                <p className="text-gray-400 text-xs">
                  Enter the email, phone number, or username associated with your account
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-gray-400 text-xs">Your password must be at least 8 characters long</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                  
                  {linkedAccounts.length > 0 && (
                    <div className="text-xs text-red-300">
                      <p className="mb-2">Please sign in using:</p>
                      <div className="flex gap-2">
                        {linkedAccounts.includes("google") && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-red-500/20 border-red-500/50 text-red-200 hover:bg-red-500/30 h-8"
                            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`}
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
                        {linkedAccounts.includes("facebook") && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-red-500/20 border-red-500/50 text-red-200 hover:bg-red-500/30 h-8"
                            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/facebook`}
                          >
                            <svg className="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-900 px-4 text-sm text-gray-400">or continue with</span>
              </div>
            </div>

            {/* Social Login Options */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                type="button"
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/facebook`}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2 text-blue-600 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            <p className="text-center text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link href="/signup/welcome" className="text-purple-400 hover:text-purple-300">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

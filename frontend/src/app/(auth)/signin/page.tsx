/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon, Sparkles } from "lucide-react"
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
    <div className="flex h-screen overflow-hidden bg-[color:var(--vooki-app-bg)]">
      {/* Left Panel — dark brand showcase */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#2d3a1e] via-[#3a4d24] to-[#4a3d6b] p-10 flex-col justify-between">
        {/* Abstract blurs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[120px]" />
          <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-white/10 blur-[80px]" />

          {/* Glassmorphic card 1 */}
          <div className="absolute top-[30%] left-[10%] w-60 h-28 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 transform -rotate-6 shadow-2xl opacity-60 flex flex-col justify-center px-5">
            <div className="h-2 w-14 bg-white/40 rounded-full mb-2.5"></div>
            <div className="h-2 w-28 bg-white/20 rounded-full mb-2.5"></div>
            <div className="h-2 w-20 bg-white/20 rounded-full"></div>
          </div>
          {/* Glassmorphic card 2 */}
          <div className="absolute bottom-[30%] right-[5%] w-64 h-36 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 transform rotate-3 shadow-2xl opacity-70 flex items-center px-5 gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-white/40 to-white/10 shrink-0"></div>
            <div className="space-y-2.5 w-full">
              <div className="h-2 w-full bg-white/20 rounded-full"></div>
              <div className="h-2 w-2/3 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="bg-white text-[color:var(--vooki-accent-text)] p-2 rounded-xl shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Vooki</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-5 max-w-lg mb-8">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight">
            Connect. <br /> Collaborate. <br /> <span className="text-white/70">Create impact.</span>
          </h1>
          <p className="text-base text-white/70 font-medium leading-relaxed max-w-md">
            Join the premium ecosystem where top brands and visionary creators build authentic campaigns together.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <div className="flex -space-x-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-[#3a4d24] bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/60 text-xs font-bold">
                  V
                </div>
              ))}
            </div>
            <p className="text-sm text-white/70 font-medium">Trusted by 10,000+ creators</p>
          </div>
        </div>
      </div>

      {/* Right Panel — form, no scroll */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 overflow-y-auto py-6 scrollbar-hide">
        <div className="mx-auto w-full max-w-md space-y-6">

          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[color:var(--vooki-app-text-strong)] tracking-tight">Welcome back</h2>
            <p className="text-[color:var(--vooki-app-text-soft)] text-sm">Enter your details to sign in to your account.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSignIn}>
            {/* Identifier */}
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                Email / Username
              </Label>
              <Input
                id="identifier"
                placeholder="Enter your email or username"
                value={formData.identifier}
                onChange={(e) => handleInputChange("identifier", e.target.value)}
                className="bg-white/50 hover:bg-white focus:bg-white transition-colors border-[color:var(--vooki-app-border-strong)] focus:border-[color:var(--vooki-accent)] text-[color:var(--vooki-app-text-strong)] rounded-xl h-11 px-4 shadow-sm"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="bg-white/50 hover:bg-white focus:bg-white transition-colors border-[color:var(--vooki-app-border-strong)] focus:border-[color:var(--vooki-accent)] text-[color:var(--vooki-app-text-strong)] rounded-xl h-11 px-4 shadow-sm pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--vooki-app-text-muted)] hover:text-[color:var(--vooki-app-text-strong)] transition-colors p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-sm font-medium">
                <p>{error}</p>
                {linkedAccounts.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-200/50 flex gap-2">
                    {linkedAccounts.includes("google") && (
                      <Button type="button" variant="outline" size="sm" className="bg-white border-red-200 text-red-700 hover:bg-red-50 rounded-lg h-8" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`}>
                        Google
                      </Button>
                    )}
                    {/* {linkedAccounts.includes("facebook") && (
                      <Button type="button" variant="outline" size="sm" className="bg-white border-red-200 text-red-700 hover:bg-red-50 rounded-lg h-8" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/facebook`}>
                        Facebook
                      </Button>
                    )} */}
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[color:var(--vooki-accent)] hover:bg-[color:var(--vooki-accent-strong)] text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] rounded-xl font-semibold h-11 text-base transition-all hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[color:var(--vooki-app-border-strong)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[color:var(--vooki-app-bg)] px-4 text-[color:var(--vooki-app-text-muted)] font-medium">Or continue with</span>
            </div>
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="bg-white border-[color:var(--vooki-app-border-strong)] hover:bg-gray-50 text-[color:var(--vooki-app-text-strong)] font-semibold rounded-xl h-11 transition-all hover:shadow-sm"
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
                <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
                <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
                <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
              </svg>
              Google
            </Button>
            {/* <Button
              type="button"
              variant="outline"
              className="bg-white border-[color:var(--vooki-app-border-strong)] hover:bg-gray-50 text-[color:var(--vooki-app-text-strong)] font-semibold rounded-xl h-11 transition-all hover:shadow-sm"
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/facebook`}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2 text-blue-600 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button> */}
          </div>

          <p className="text-center text-sm text-[color:var(--vooki-app-text-soft)]">
            Don&apos;t have an account?{" "}
            <Link href="/signup/welcome" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

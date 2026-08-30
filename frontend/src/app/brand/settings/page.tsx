"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import {
  ShieldCheck,
  Briefcase,
  Users,
  Save,
  Mail,
  Phone,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Loader2,
  Info
} from "lucide-react"

export default function BrandSettingsPage() {
  const { user, refreshUser } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [accountData, setAccountData] = useState({
    contactName: "",
    contactRole: "",
    email: "",
    phone: ""
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: ""
  })

  const [defaultsData, setDefaultsData] = useState({
    usageRights: "Content can be reposted natively on brand's social media channels (Instagram) for up to 6 months with credit to the creator.",
    exclusivityPeriod: 30
  })

  useEffect(() => {
    if (user) {
      setAccountData({
        contactName: user.name || "",
        contactRole: (user as any).brandProfile?.contactRole || "",
        email: user.email || "",
        phone: user.phone ? String(user.phone) : ""
      })

      const userDefaults = (user as any).brandProfile?.collaborationDefaults;
      if (userDefaults) {
        setDefaultsData({
          usageRights: userDefaults.usageRights || "Content can be reposted natively on brand's social media channels (Instagram) for up to 6 months with credit to the creator.",
          exclusivityPeriod: userDefaults.exclusivityPeriod ?? 30
        })
      }
    }
  }, [user])

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleDefaultsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDefaultsData(prev => ({ ...prev, [name]: name === "exclusivityPeriod" ? Number(value) : value }))
  }

  const handleSaveAccount = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/brand`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: accountData.contactName,
          email: accountData.email,
          phone: accountData.phone,
          brandProfile: {
            contactRole: accountData.contactRole,
            collaborationDefaults: defaultsData
          }
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to update account")
      }

      await refreshUser()
      setMessage({ type: 'success', text: "Account updated successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    setPasswordSaving(true)
    setPasswordMessage(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passwordData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to update password")
      }

      setPasswordData({ currentPassword: "", newPassword: "" })
      setPasswordMessage({ type: 'success', text: "Password updated successfully!" })
      setTimeout(() => setPasswordMessage(null), 3000)
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message })
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge className="mb-2 border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] text-[color:var(--vooki-app-text-muted)] hover:bg-[color:var(--vooki-app-surface-hover)]">
            Account Management
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-[color:var(--vooki-app-text-strong)]">
            Settings
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {message && (
            <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {message.text}
            </span>
          )}
          <Button
            onClick={handleSaveAccount}
            disabled={isSaving}
            className="h-11 rounded-xl bg-[color:var(--vooki-app-brand)] px-6 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:bg-[color:var(--vooki-app-brand-hover)] transition-all"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-8 flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger
            value="account"
            className="rounded-xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[color:var(--vooki-app-text-soft)] data-[state=active]:border-[color:var(--vooki-app-border)] data-[state=active]:bg-[color:var(--vooki-app-surface)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-sm transition-all"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Account & Security
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="rounded-xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[color:var(--vooki-app-text-soft)] data-[state=active]:border-[color:var(--vooki-app-border)] data-[state=active]:bg-[color:var(--vooki-app-surface)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-sm transition-all"
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Collaboration Defaults
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="rounded-xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[color:var(--vooki-app-text-soft)] data-[state=active]:border-[color:var(--vooki-app-border)] data-[state=active]:bg-[color:var(--vooki-app-surface)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-sm transition-all"
          >
            <Users className="mr-2 h-4 w-4" />
            Team / Workspace
          </TabsTrigger>
        </TabsList>

        {/* 1. ACCOUNT & SECURITY TAB */}
        <TabsContent value="account" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="max-w-3xl space-y-6">
            <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] p-6 shadow-sm backdrop-blur-md">
              <h2 className="mb-1 text-lg font-bold text-[color:var(--vooki-app-text-strong)]">Private Account Details</h2>
              <p className="mb-6 text-sm text-[color:var(--vooki-app-text-soft)]">These details are not visible to creators.</p>

              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactName" className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Primary Contact Name</Label>
                    <Input
                      id="contactName"
                      value={accountData.contactName}
                      onChange={handleAccountChange}
                      className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] focus-visible:ring-[color:var(--vooki-app-brand)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactRole" className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Your Role</Label>
                    <Input
                      id="contactRole"
                      value={accountData.contactRole}
                      onChange={handleAccountChange}
                      placeholder="Head of Partnerships"
                      className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] focus-visible:ring-[color:var(--vooki-app-brand)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Login Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-5 w-5 text-[color:var(--vooki-app-text-muted)]" />
                    <Input
                      id="email"
                      type="email"
                      value={accountData.email}
                      onChange={handleAccountChange}
                      className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] pl-11 focus-visible:ring-[color:var(--vooki-app-brand)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-5 w-5 text-[color:var(--vooki-app-text-muted)]" />
                    <Input
                      id="phone"
                      type="tel"
                      value={accountData.phone}
                      onChange={handleAccountChange}
                      placeholder="1234567890"
                      className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] pl-11 focus-visible:ring-[color:var(--vooki-app-brand)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] p-6 shadow-sm backdrop-blur-md">
              <h2 className="mb-4 text-lg font-bold text-[color:var(--vooki-app-text-strong)]">Security</h2>

              <div className="space-y-6">
                <div className="space-y-4 rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] p-4">
                  <h3 className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">Change Password</h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-5 w-5 text-[color:var(--vooki-app-text-muted)]" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Current Password"
                        className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] pl-11 focus-visible:ring-[color:var(--vooki-app-brand)]"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-5 w-5 text-[color:var(--vooki-app-text-muted)]" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="New Password"
                        className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] pl-11 focus-visible:ring-[color:var(--vooki-app-brand)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-[color:var(--vooki-app-text-muted)] hover:text-[color:var(--vooki-app-text-strong)]"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <Button
                        onClick={handleUpdatePassword}
                        disabled={passwordSaving || !passwordData.currentPassword || !passwordData.newPassword}
                        variant="outline"
                        className="h-9 rounded-lg border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] text-xs font-semibold"
                      >
                        {passwordSaving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Update Password
                      </Button>

                      {passwordMessage && (
                        <span className={`text-xs font-medium ${passwordMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                          {passwordMessage.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--vooki-app-glow-brand)]/20 text-[color:var(--vooki-app-brand)]">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">Two-Factor Authentication</h4>
                      <p className="text-xs text-[color:var(--vooki-app-text-soft)]">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 rounded-lg border-[color:var(--vooki-app-border)] bg-transparent text-xs font-semibold">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. COLLABORATION DEFAULTS TAB */}
        <TabsContent value="preferences" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="max-w-3xl space-y-6">
            <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] p-6 shadow-sm backdrop-blur-md">
              <h2 className="mb-6 text-lg font-bold text-[color:var(--vooki-app-text-strong)]">Default Campaign Terms</h2>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Standard Usage Rights</Label>
                  <Textarea
                    name="usageRights"
                    value={defaultsData.usageRights}
                    onChange={handleDefaultsChange}
                    rows={3}
                    className="rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] focus-visible:ring-[color:var(--vooki-app-brand)] text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Exclusivity Period</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      name="exclusivityPeriod"
                      value={defaultsData.exclusivityPeriod}
                      onChange={handleDefaultsChange}
                      className="h-11 w-28 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] focus-visible:ring-[color:var(--vooki-app-brand)] font-semibold"
                    />
                    <span className="text-sm font-medium text-[color:var(--vooki-app-text-soft)]">days post-publication</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 3. TEAM & WORKSPACE TAB (COMING SOON) */}
        <TabsContent value="team" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="max-w-4xl rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] p-12 text-center shadow-sm backdrop-blur-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--vooki-app-glow-brand)]/10 text-[color:var(--vooki-app-brand)]">
              <Users className="h-10 w-10" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">Team Workspace is Coming Soon</h2>
            <p className="mx-auto max-w-lg text-[color:var(--vooki-app-text-soft)]">
              Soon you will be able to invite your marketing coordinators, assign roles, and manage campaigns collaboratively under one unified brand account.
            </p>
            <Button disabled className="mt-8 h-11 rounded-xl bg-[color:var(--vooki-app-surface-hover)] px-8 font-semibold text-[color:var(--vooki-app-text-muted)]">
              Invite Team Member (Coming Soon)
            </Button>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import {
  ShieldCheck,
  CreditCard,
  Bell,
  Save,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Loader2,
  Sliders
} from "lucide-react"

export default function InfluencerSettingsPage() {
  const { user, refreshUser } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [preferences, setPreferences] = useState({
    minimumRate: 0,
    contentBoundaries: "",
  })
  
  const [notifications, setNotifications] = useState({
    newCollabInvites: true,
    messageNotifications: true,
    marketingUpdates: false,
  })

  useEffect(() => {
    if (user) {
      const details = (user as any).influencerProfile || (user as any).influencerDetails || {}
      const notifs = (user as any).notificationPreferences || {}
      
      setPreferences({
        minimumRate: details.preferences?.minimumRate?.amount || 0,
        contentBoundaries: details.preferences?.contentBoundaries || "",
      })
      
      setNotifications({
        newCollabInvites: notifs.newCollabInvites ?? true,
        messageNotifications: notifs.messageNotifications ?? true,
        marketingUpdates: notifs.marketingUpdates ?? false,
      })
    }
  }, [user])

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: ""
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }))
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

  const handleSavePreferences = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings/influencer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          influencerProfile: {
            preferences: {
              minimumRate: { amount: preferences.minimumRate, currency: "INR" },
              contentBoundaries: preferences.contentBoundaries
            }
          }
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to update preferences")
      }

      await refreshUser()
      setMessage({ type: 'success', text: "Preferences saved successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleNotification = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key]
    // Optimistic UI update
    setNotifications(prev => ({ ...prev, [key]: newValue }))
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/settings/influencer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          notificationPreferences: {
            ...notifications,
            [key]: newValue
          }
        })
      })

      if (!res.ok) {
        throw new Error("Failed to update notification")
      }
      await refreshUser()
    } catch (err: any) {
      // Revert on error
      setNotifications(prev => ({ ...prev, [key]: !newValue }))
      console.error(err)
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
        </div>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="mb-8 flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger
            value="security"
            className="rounded-xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[color:var(--vooki-app-text-soft)] data-[state=active]:border-[color:var(--vooki-app-border)] data-[state=active]:bg-[color:var(--vooki-app-surface)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-sm transition-all"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="rounded-xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[color:var(--vooki-app-text-soft)] data-[state=active]:border-[color:var(--vooki-app-border)] data-[state=active]:bg-[color:var(--vooki-app-surface)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-sm transition-all"
          >
            <Sliders className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[color:var(--vooki-app-text-soft)] data-[state=active]:border-[color:var(--vooki-app-border)] data-[state=active]:bg-[color:var(--vooki-app-surface)] data-[state=active]:text-[color:var(--vooki-app-text-strong)] data-[state=active]:shadow-sm transition-all"
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* 1. SECURITY TAB */}
        <TabsContent value="security" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="max-w-3xl space-y-6">
            <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] p-6 shadow-sm backdrop-blur-md">
              <h2 className="mb-4 text-lg font-bold text-[color:var(--vooki-app-text-strong)]">Security & Login</h2>

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

        {/* 2. PREFERENCES TAB */}
        <TabsContent value="preferences" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="max-w-3xl space-y-6">
            <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] p-6 shadow-sm backdrop-blur-md">
              <h2 className="mb-6 text-lg font-bold text-[color:var(--vooki-app-text-strong)]">Collaboration Preferences</h2>
              
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Minimum Rate</Label>
                  <p className="text-xs text-[color:var(--vooki-app-text-soft)] mb-2">We will automatically filter out invites that fall below this budget.</p>
                  <Input
                    type="number"
                    value={preferences.minimumRate}
                    onChange={(e) => setPreferences({ ...preferences, minimumRate: Number(e.target.value) })}
                    className="h-11 max-w-xs rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] focus-visible:ring-[color:var(--vooki-app-brand)]"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]">Content Boundaries</Label>
                  <p className="text-xs text-[color:var(--vooki-app-text-soft)] mb-2">Specify industries or topics you do not work with (e.g., Gambling, Alcohol).</p>
                  <Input
                    placeholder="e.g. No gambling, no alcohol..."
                    value={preferences.contentBoundaries}
                    onChange={(e) => setPreferences({ ...preferences, contentBoundaries: e.target.value })}
                    className="h-11 rounded-xl border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-hover)] focus-visible:ring-[color:var(--vooki-app-brand)]"
                  />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[color:var(--vooki-app-border)] flex items-center justify-between">
                {message && (
                  <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {message.text}
                  </span>
                )}
                <Button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="h-11 rounded-xl bg-[color:var(--vooki-app-brand)] px-6 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:bg-[color:var(--vooki-app-brand-hover)] transition-all ml-auto"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 3. NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="max-w-3xl space-y-6">
            <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface)] p-6 shadow-sm backdrop-blur-md">
              <h2 className="mb-6 text-lg font-bold text-[color:var(--vooki-app-text-strong)]">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">New Collaboration Invites</h4>
                    <p className="text-xs text-[color:var(--vooki-app-text-soft)]">Receive an email when a brand invites you to a campaign.</p>
                  </div>
                  <button 
                    onClick={() => handleToggleNotification('newCollabInvites')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${notifications.newCollabInvites ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span 
                      style={{ backgroundColor: '#ffffff' }}
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${notifications.newCollabInvites ? 'translate-x-5' : 'translate-x-0'}`} 
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">Message Notifications</h4>
                    <p className="text-xs text-[color:var(--vooki-app-text-soft)]">Receive an email when you get a new message.</p>
                  </div>
                  <button 
                    onClick={() => handleToggleNotification('messageNotifications')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${notifications.messageNotifications ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span 
                      style={{ backgroundColor: '#ffffff' }}
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${notifications.messageNotifications ? 'translate-x-5' : 'translate-x-0'}`} 
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[color:var(--vooki-app-text-strong)]">Marketing Updates</h4>
                    <p className="text-xs text-[color:var(--vooki-app-text-soft)]">Receive tips and news from Vooki.</p>
                  </div>
                  <button 
                    onClick={() => handleToggleNotification('marketingUpdates')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${notifications.marketingUpdates ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span 
                      style={{ backgroundColor: '#ffffff' }}
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${notifications.marketingUpdates ? 'translate-x-5' : 'translate-x-0'}`} 
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}

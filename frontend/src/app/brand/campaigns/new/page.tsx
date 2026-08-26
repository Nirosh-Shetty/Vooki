"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Priority = "low" | "medium" | "high"
type Currency = "USD" | "INR" | "EUR" | "GBP"

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
}

const NICHES = [
  "Tech & Gadgets",
  "Fashion & Style",
  "Beauty & Skincare",
  "Fitness & Health",
  "Lifestyle",
  "Gaming & Esports",
  "Food & Beverage",
  "Travel & Adventure",
  "Finance & Crypto",
  "Education",
]

export default function NewCampaignPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [objective, setObjective] = useState("")
  const [niche, setNiche] = useState("Lifestyle")
  const [customNiche, setCustomNiche] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [currency, setCurrency] = useState<Currency>("USD")
  const [budgetTotal, setBudgetTotal] = useState("")

  const todayStr = new Date().toISOString().split("T")[0]
  const defaultEndStr = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(defaultEndStr)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currencySymbol = CURRENCY_SYMBOLS[currency] || "$"
  const isOtherNiche = niche === "__other__"
  const resolvedNiche = isOtherNiche ? customNiche.trim() || "General" : niche

  const formattedBudget = useMemo(() => {
    const num = Number(budgetTotal)
    if (!budgetTotal || isNaN(num) || num <= 0) return `${currencySymbol}0`
    return `${currencySymbol}${num.toLocaleString("en-US")}`
  }, [budgetTotal, currencySymbol])

  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
    return diff > 0 ? diff : 0
  }, [startDate, endDate])

  const setDurationPreset = (days: number) => {
    const base = startDate ? new Date(startDate) : new Date()
    setEndDate(new Date(base.getTime() + days * 86400000).toISOString().split("T")[0])
  }

  const checklist = useMemo(() => {
    const items = [
      name.trim().length >= 3,
      objective.trim().length >= 10,
      Number(budgetTotal) > 0,
      Boolean(startDate && endDate && durationDays > 0),
    ]
    const done = items.filter(Boolean).length
    return { done, pct: Math.round((done / 4) * 100), ready: done === 4, items }
  }, [name, objective, budgetTotal, startDate, endDate, durationDays])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!name.trim()) { setError("Enter a campaign name."); return }
    if (!objective.trim()) { setError("Describe the objective."); return }
    if (!budgetTotal || Number(budgetTotal) <= 0) { setError("Enter a valid budget."); return }
    if (!startDate || !endDate) { setError("Choose valid dates."); return }
    if (new Date(endDate) < new Date(startDate)) { setError("End date can't be before start."); return }

    setSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/campaigns`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          objective: objective.trim(),
          niche: resolvedNiche,
          priority,
          currency,
          budgetTotal: Number(budgetTotal),
          startDate,
          endDate,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || "Failed to create campaign")
      }
      router.push("/brand/campaigns")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create campaign")
    } finally {
      setSubmitting(false)
    }
  }

  /* ── shared input classes ─────────────────────────────────── */
  const inputCls =
    "h-10 border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-bg)] rounded-xl text-sm font-medium text-[color:var(--vooki-app-text-strong)] placeholder:text-[color:var(--vooki-app-text-muted)] focus-visible:ring-1 focus-visible:ring-[color:var(--vooki-accent)]"
  const labelCls =
    "text-[11px] font-semibold uppercase tracking-wider text-[color:var(--vooki-app-text-muted)]"

  /* ── render ────────────────────────────────────────────────── */
  return (
    <div className="relative flex flex-col lg:h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] text-[color:var(--vooki-app-text-strong)] lg:overflow-hidden">
      {/* glows */}
      <div className="pointer-events-none absolute -top-10 left-1/4 h-80 w-80 rounded-full bg-[color:var(--vooki-app-glow-green)] blur-3xl opacity-30" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-[color:var(--vooki-app-glow-violet)] blur-3xl opacity-20" />

      {/* ── Action Bar ───────────────────────────────────────── */}
      <header className="relative z-10 shrink-0 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center justify-between">
        <Button
          asChild variant="ghost" size="sm"
          className="group -ml-2 gap-1.5 text-xs font-semibold text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)] rounded-full px-3"
        >
          <Link href="/brand/campaigns">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Campaigns
          </Link>
        </Button>

        {/* Top CTA */}
        <Button
          type="submit"
          form="campaign-form"
          disabled={submitting || !checklist.ready}
          className="flex h-9 rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-extrabold bg-[color:var(--vooki-accent)] text-black hover:bg-[color:var(--vooki-accent-strong)] shadow-[var(--vooki-shadow-accent)] transition-transform hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wait...</> : "Launch"}
        </Button>
      </header>

      {/* ── two-column body ────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 gap-6 lg:gap-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 min-h-0">

        {/* LEFT — scrollable form */}
        <div className="flex-1 lg:overflow-y-auto scrollbar-hide pb-8 lg:pb-10 px-2 -mx-2 min-w-0">
          <form onSubmit={handleSubmit} id="campaign-form" className="space-y-8">

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* ─── Name & Objective ─────────────────────────────── */}
            <section className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className={labelCls}>Campaign Name</label>
                  <span className="text-[11px] text-[color:var(--vooki-app-text-muted)]">{name.length}/140</span>
                </div>
                <Input
                  maxLength={140}
                  placeholder="e.g. Summer Skincare Launch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className={labelCls}>Objective</label>
                  <span className="text-[11px] text-[color:var(--vooki-app-text-muted)]">{objective.length}/500</span>
                </div>
                <Textarea
                  maxLength={500}
                  rows={3}
                  placeholder="What do you want to achieve?"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className={`min-h-[80px] resize-y ${inputCls}`}
                  required
                />
              </div>
            </section>

            <hr className="border-[color:var(--vooki-app-border)]" />

            {/* ─── Niche & Priority ─────────────────────────────── */}
            <section className="space-y-5">
              <div className="space-y-2">
                <label className={labelCls}>Niche</label>
                <div className="flex flex-wrap gap-1.5">
                  {NICHES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setNiche(item)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-colors ${
                        niche === item
                          ? "border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] text-black"
                          : "border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-soft)] hover:border-[color:var(--vooki-app-border-strong)] hover:text-[color:var(--vooki-app-text-strong)]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNiche("__other__")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-colors ${
                      isOtherNiche
                        ? "border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] text-black"
                        : "border-dashed border-[color:var(--vooki-app-border-strong)] text-[color:var(--vooki-app-text-soft)] hover:text-[color:var(--vooki-app-text-strong)]"
                    }`}
                  >
                    Others
                  </button>
                </div>
                {isOtherNiche && (
                  <Input
                    autoFocus
                    maxLength={80}
                    placeholder="Type your niche"
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    className={`mt-2 max-w-xs ${inputCls}`}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Priority</label>
                <div className="flex gap-2">
                  {([
                    { key: "low" as Priority, label: "Low", dot: "bg-slate-400" },
                    { key: "medium" as Priority, label: "Medium", dot: "bg-amber-500" },
                    { key: "high" as Priority, label: "High", dot: "bg-rose-500" },
                  ]).map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPriority(p.key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold border transition-colors ${
                        priority === p.key
                          ? "border-[color:var(--vooki-accent)] bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-app-text-strong)]"
                          : "border-[color:var(--vooki-app-border)] text-[color:var(--vooki-app-text-soft)] hover:border-[color:var(--vooki-app-border-strong)]"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <hr className="border-[color:var(--vooki-app-border)]" />

            {/* ─── Budget ──────────────────────────────────────── */}
            <section className="space-y-4">
              <label className={labelCls}>Budget</label>
              <div className="flex gap-3 items-end">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className={`w-24 shrink-0 ${inputCls} px-2.5 font-bold`}
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[color:var(--vooki-app-text-muted)]">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    placeholder="5000"
                    value={budgetTotal}
                    onChange={(e) => setBudgetTotal(e.target.value)}
                    className={`pl-7 ${inputCls}`}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[1000, 2500, 5000, 10000, 25000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBudgetTotal(String(amt))}
                    className="rounded-full border border-[color:var(--vooki-app-border)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--vooki-app-text-soft)] hover:border-[color:var(--vooki-accent)] hover:text-[color:var(--vooki-app-text-strong)] transition-colors"
                  >
                    {currencySymbol}{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </section>

            <hr className="border-[color:var(--vooki-app-border)]" />

            {/* ─── Timeline ────────────────────────────────────── */}
            <section className="space-y-4">
              <label className={labelCls}>Timeline</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-[color:var(--vooki-app-text-muted)]">Start</span>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} required />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-[color:var(--vooki-app-text-muted)]">End</span>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} required />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[{ l: "2w", d: 14 }, { l: "1mo", d: 30 }, { l: "2mo", d: 60 }, { l: "3mo", d: 90 }].map((p) => (
                  <button
                    key={p.d}
                    type="button"
                    onClick={() => setDurationPreset(p.d)}
                    className="rounded-full border border-[color:var(--vooki-app-border)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--vooki-app-text-soft)] hover:border-[color:var(--vooki-accent)] hover:text-[color:var(--vooki-app-text-strong)] transition-colors"
                  >
                    {p.l}
                  </button>
                ))}
                {durationDays > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[color:var(--vooki-accent)] bg-[color:var(--vooki-accent-soft)] px-2.5 py-1 rounded-full border border-[color:var(--vooki-accent-border)]">
                    <Clock className="h-3 w-3" />
                    {durationDays}d
                  </span>
                )}
              </div>
            </section>

            <hr className="border-[color:var(--vooki-app-border)]" />

            {/* ─── Payment ─────────────────────────────────────── */}
            <section className="space-y-3">
              <label className={labelCls}>Payment Method</label>
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl border border-[color:var(--vooki-accent)] bg-[color:var(--vooki-accent-soft)] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[color:var(--vooki-app-text-strong)]">Direct</span>
                    <Badge className="bg-[color:var(--vooki-accent)] text-black font-bold text-[10px] border-0 px-1.5">Active</Badge>
                  </div>
                  <p className="text-[11px] text-[color:var(--vooki-app-text-soft)] mt-0.5">Payouts go directly to creators.</p>
                </div>
                <div className="flex-1 rounded-xl border border-dashed border-[color:var(--vooki-app-border)] p-3.5 opacity-50 cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[color:var(--vooki-app-text-muted)]">Escrow</span>
                    <Badge className="bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30 px-1.5">Soon</Badge>
                  </div>
                  <p className="text-[11px] text-[color:var(--vooki-app-text-muted)] mt-0.5">Held until verified.</p>
                </div>
              </div>
            </section>

            {/* Mobile Inline CTA */}
            <div className="lg:hidden pt-4">
              <Button
                type="submit"
                disabled={submitting || !checklist.ready}
                className="w-full h-11 rounded-xl font-extrabold bg-[color:var(--vooki-accent)] text-black hover:bg-[color:var(--vooki-accent-strong)] shadow-[var(--vooki-shadow-accent)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Launch Campaign"}
              </Button>
            </div>

            <div className="h-4" />
          </form>
        </div>

        {/* RIGHT — sticky preview panel */}
        <aside className="hidden lg:block lg:w-[340px] xl:w-[360px] shrink-0">
          <div className="rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-gradient-to-b from-[color:var(--vooki-app-surface-card)] to-[color:var(--vooki-app-surface)] shadow-[var(--vooki-shadow-card)] backdrop-blur-2xl p-5 space-y-5">

              {/* Preview header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[color:var(--vooki-app-text-muted)] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--vooki-accent)] animate-pulse" />
                  Preview
                </span>
                <Badge className="border-0 bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">Draft</Badge>
              </div>

              {/* Mock card */}
              <div className="rounded-2xl border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Badge className="rounded border-0 bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-text)] font-bold text-[10px] px-1.5">
                    {resolvedNiche}
                  </Badge>
                  <Badge className={`rounded border-0 font-bold text-[10px] uppercase px-1.5 ${
                    priority === "high" ? "bg-rose-500/20 text-rose-300"
                    : priority === "medium" ? "bg-amber-500/20 text-amber-300"
                    : "bg-slate-500/20 text-slate-300"
                  }`}>
                    {priority}
                  </Badge>
                </div>
                <h3 className="text-base font-extrabold leading-snug line-clamp-2 text-[color:var(--vooki-app-text-strong)]">
                  {name.trim() || "Campaign Title"}
                </h3>
                <p className="text-[11px] text-[color:var(--vooki-app-text-soft)] line-clamp-2 leading-relaxed">
                  {objective.trim() || "Objective will appear here."}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[color:var(--vooki-app-border)]">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[color:var(--vooki-app-text-muted)]">Budget</p>
                    <p className="text-sm font-extrabold text-[color:var(--vooki-accent)] mt-0.5">{formattedBudget}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[color:var(--vooki-app-text-muted)]">Duration</p>
                    <p className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)] mt-0.5">
                      {durationDays > 0 ? `${durationDays} Days` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Readiness */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-[color:var(--vooki-app-text-soft)]">Readiness</span>
                  <span className="text-[color:var(--vooki-accent)]">{checklist.pct}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-[color:var(--vooki-app-border)] overflow-hidden">
                  <div className="h-full bg-[color:var(--vooki-accent)] transition-all duration-300 rounded-full" style={{ width: `${checklist.pct}%` }} />
                </div>
                <div className="space-y-1 text-[11px] font-medium text-[color:var(--vooki-app-text-soft)]">
                  {(["Name", "Objective", "Budget", "Timeline"] as const).map((label, i) => (
                    <div key={label} className="flex items-center gap-1.5">
                      {checklist.items[i]
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        : <Circle className="h-3.5 w-3.5 text-[color:var(--vooki-app-text-muted)] shrink-0" />
                      }
                      <span className={checklist.items[i] ? "text-[color:var(--vooki-app-text-strong)]" : ""}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA moved to header */}
          </div>
        </aside>
      </div>
    </div>
  )
}

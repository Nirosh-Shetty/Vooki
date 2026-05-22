"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronDown,
  Handshake,
  MessageSquare,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const roleCards = [
  {
    title: "Brands",
    icon: Building2,
    accent: "var(--vooki-accent-strong)",
    description:
      "Find the right creators, start the conversation faster, and keep campaigns feeling clear instead of chaotic.",
    points: [
      "Discover people who actually fit the brief",
      "Negotiate in one thread instead of scattered DMs",
      "Track delivery and payout without turning it into admin",
    ],
  },
  {
    title: "Creators",
    icon: Users,
    accent: "var(--vooki-violet-base)",
    description:
      "See serious opportunities, keep collaboration details in one place, and never feel like you are using a CRM.",
    points: [
      "Know what the brand wants at a glance",
      "Keep deal context, timelines, and chat together",
      "Handle delivery, proof, and payment with less friction",
    ],
  },
  {
    title: "Managers",
    icon: UserCheck,
    accent: "var(--vooki-blue-base)",
    description:
      "Coordinate multiple creator relationships with a workspace that stays calm even when the workload grows.",
    points: [
      "Manage outreach and replies from one rhythm-friendly place",
      "Stay on top of deliverables without micromanaging",
      "Keep commercial details visible for the whole team",
    ],
  },
];

const flowSteps = [
  {
    label: "Discover",
    title: "Start with a shortlist, not a spreadsheet",
    copy: "Brands build campaigns, browse creators, and invite only the people who genuinely match the idea.",
  },
  {
    label: "Talk",
    title: "Let the human conversation happen first",
    copy: "Once interest is there, both sides talk in one thread with the campaign context already understood.",
  },
  {
    label: "Align",
    title: "Turn agreement into a clean collaboration",
    copy: "The deal becomes structured only after both sides are aligned, so the product supports people instead of replacing them.",
  },
  {
    label: "Deliver",
    title: "Move smoothly through content, proof, and payout",
    copy: "Creators deliver, brands review, and payment stays tied to the same collaboration instead of getting lost elsewhere.",
  },
];

const highlightCards = [
  {
    title: "Calm by default",
    description:
      "Every screen has one clear next step. Complexity stays tucked away until it is useful.",
  },
  {
    title: "Social-first workflow",
    description: "Chat is part of the collaboration, not a disconnected inbox floating beside it.",
  },
  {
    title: "Premium without feeling cold",
    description:
      "Rounded surfaces, softer contrast, and spacious layouts make the product feel warm and modern.",
  },
];

const faqs = [
  {
    question: "What is Vooki for?",
    answer:
      "Vooki is a creator collaboration workspace for brands, creators, and managers. It keeps discovery, conversation, deal alignment, delivery, and payout connected in one place.",
  },
  {
    question: "Is this built more for creators or brands?",
    answer:
      "Both. Brands need structure, creators need clarity, and both need a workflow that still feels human. The product is designed to balance both sides instead of forcing one enterprise-style process on everyone.",
  },
  {
    question: "Do collaborations start with forms?",
    answer:
      "No. The idea is to start with discovery and conversation, then turn the agreed details into a structured collaboration only when it actually helps.",
  },
  {
    question: "What happens after a creator accepts an invite?",
    answer:
      "The brand and creator move into a collaboration flow that keeps the chat, expectations, delivery steps, and payment status tied to the same context.",
  },
  {
    question: "Can managers work across multiple creators?",
    answer:
      "Yes. Managers get the same calm workflow, but with visibility across more relationships and campaigns.",
  },
];

const roleLinks = [
  {
    title: "Join as a brand",
    href: "/signup/basic-info?role=brand",
    description: "Create campaigns, discover creators, and run smoother collaborations.",
  },
  {
    title: "Join as a creator",
    href: "/signup/basic-info?role=influencer",
    description: "Keep opportunities, conversations, delivery, and payment in one place.",
  },
  {
    title: "Join as a manager",
    href: "/signup/basic-info?role=manager",
    description: "Coordinate creator relationships without turning the work into overhead.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[color:var(--vooki-home-bg)] text-[color:var(--vooki-home-text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[color:var(--vooki-home-glow-green)] blur-3xl" />
        <div className="absolute right-[-7rem] top-28 h-80 w-80 rounded-full bg-[color:var(--vooki-home-glow-violet)] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[color:var(--vooki-home-glow-blue)] blur-3xl" />
      </div>

      <div className="relative">
        <nav className="border-b border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-nav)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-chip)] shadow-[var(--vooki-shadow-soft)]">
                <Sparkles className="h-5 w-5 text-[color:var(--vooki-accent-strong)]" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-[color:var(--vooki-home-text)]">
                  Vooki
                </p>
                <p className="text-xs text-[color:var(--vooki-home-text-subtle)]">
                  Creator collaboration workspace
                </p>
              </div>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              <Link
                href="#roles"
                className="text-sm text-[color:var(--vooki-home-text-muted)] transition-colors hover:text-[color:var(--vooki-home-text)]"
              >
                Who it is for
              </Link>
              <Link
                href="#workflow"
                className="text-sm text-[color:var(--vooki-home-text-muted)] transition-colors hover:text-[color:var(--vooki-home-text)]"
              >
                How it works
              </Link>
              <Link
                href="#faq"
                className="text-sm text-[color:var(--vooki-home-text-muted)] transition-colors hover:text-[color:var(--vooki-home-text)]"
              >
                FAQ
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                className="rounded-full px-4 text-[color:var(--vooki-home-text)] hover:bg-[color:var(--vooki-home-surface-hover)] hover:text-[color:var(--vooki-home-text)]"
              >
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button
                asChild
                className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] px-5 text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] transition-transform hover:-translate-y-0.5 hover:bg-[color:var(--vooki-accent-strong)]"
              >
                <Link href="/signup/role">Get started</Link>
              </Button>
            </div>
          </div>
        </nav>

        <main>
          <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:pb-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface-hover)] px-4 py-2 text-sm text-[color:var(--vooki-home-text-muted)] shadow-[var(--vooki-shadow-soft)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--vooki-accent)]" />
                Built for daily creator collaboration, not admin work
              </div>

              <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-[color:var(--vooki-home-text)] sm:text-6xl lg:text-7xl">
                Collaboration that feels social, calm, and actually usable.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--vooki-home-text-muted)] sm:text-xl">
                Vooki brings discovery, chat, deal alignment, delivery, and payouts into one premium
                workspace that creators actually want to open every day.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] px-6 text-base text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] transition-transform hover:-translate-y-0.5 hover:bg-[color:var(--vooki-accent-strong)]"
                >
                  <Link href="/signup/role">
                    Start your workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-12 rounded-full border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-chip)] px-6 text-base text-[color:var(--vooki-home-text)] hover:bg-[color:var(--vooki-home-chip-hover)]"
                >
                  <Link href="#workflow">See the flow</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-3 text-sm text-[color:var(--vooki-home-text-muted)]">
                {[
                  "Creator-friendly UX",
                  "Chat-first collaboration",
                  "Clear delivery and payout flow",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-chip)] px-4 py-2"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/8 to-white/0 blur-2xl" />
              <Card className="relative overflow-hidden rounded-[32px] border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface)] shadow-[var(--vooki-shadow-float)] backdrop-blur-xl">
                <CardContent className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4 border-b border-[color:var(--vooki-home-border-soft)] pb-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--vooki-home-text-faint)]">
                        Today in Vooki
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-[color:var(--vooki-home-text)]">
                        A softer way to run a creator campaign
                      </h2>
                    </div>
                    <span className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent-soft)] px-3 py-1 text-xs font-medium text-[color:var(--vooki-accent-strong)]">
                      Live workspace
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-[24px] border border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-surface-strong)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-[color:var(--vooki-home-text-soft)]">
                            Spring skincare drop
                          </p>
                          <p className="mt-1 text-sm text-[color:var(--vooki-home-text-dim)]">
                            Creator shortlist, active chat, delivery review, and payout all stay
                            connected.
                          </p>
                        </div>
                        <div className="rounded-full bg-[color:var(--vooki-violet-soft)] px-3 py-1 text-xs font-medium text-[color:var(--vooki-violet)]">
                          3 active talks
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-surface)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[color:var(--vooki-home-text-soft)]">
                              Chat stays central
                            </p>
                            <p className="text-sm text-[color:var(--vooki-home-text-dim)]">
                              Negotiate where the relationship already lives.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-surface)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]">
                            <Handshake className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[color:var(--vooki-home-text-soft)]">
                              Agreements feel light
                            </p>
                            <p className="text-sm text-[color:var(--vooki-home-text-dim)]">
                              Structure appears only once both sides align.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-[24px] border border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-surface-muted)] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-home-text-faint)]">
                          Discovery
                        </p>
                        <p className="mt-3 text-sm text-[color:var(--vooki-home-text)]">
                          Invite the right people
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-surface-muted)] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-home-text-faint)]">
                          Delivery
                        </p>
                        <p className="mt-3 text-sm text-[color:var(--vooki-home-text)]">
                          Keep proof and feedback together
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-surface-muted)] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-home-text-faint)]">
                          Payout
                        </p>
                        <p className="mt-3 text-sm text-[color:var(--vooki-home-text)]">
                          Know exactly what gets paid and when
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="roles" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-home-text-faint)]">
                Who it is for
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--vooki-home-text)] sm:text-4xl">
                One product, shaped around the people actually doing the work.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[color:var(--vooki-home-text-muted)]">
                Vooki should feel natural whether you are running brand partnerships, growing as a
                creator, or coordinating everything behind the scenes.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {roleCards.map((role) => {
                const Icon = role.icon;

                return (
                  <Card
                    key={role.title}
                    className="rounded-[28px] border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface)] shadow-[var(--vooki-shadow-card)] backdrop-blur"
                  >
                    <CardContent className="p-7">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-chip)]">
                        <Icon className="h-5 w-5" style={{ color: role.accent }} />
                      </div>
                      <h3 className="mt-6 text-2xl font-semibold text-[color:var(--vooki-home-text)]">
                        {role.title}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-[color:var(--vooki-home-text-muted)]">
                        {role.description}
                      </p>
                      <ul className="mt-6 space-y-3 text-sm text-[color:var(--vooki-home-text-soft)]">
                        {role.points.map((point) => (
                          <li key={point} className="flex items-start gap-3">
                            <span
                              className="mt-2 h-2 w-2 rounded-full"
                              style={{ backgroundColor: role.accent }}
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface)] px-6 py-8 shadow-[var(--vooki-shadow-card)] sm:px-8 sm:py-10">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-home-text-faint)]">
                  Why it feels different
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--vooki-home-text)] sm:text-4xl">
                  Less operational noise. More forward motion.
                </h2>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {highlightCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[24px] border border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-surface-muted)] p-6"
                  >
                    <p className="text-lg font-medium text-[color:var(--vooki-home-text-soft)]">
                      {card.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--vooki-home-text-muted)]">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="workflow" className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-home-text-faint)]">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--vooki-home-text)] sm:text-4xl">
                A clearer collaboration flow from first invite to final payout.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {flowSteps.map((step, index) => {
                const icons = [Users, MessageSquare, CalendarClock, Wallet];
                const Icon = icons[index];

                return (
                  <Card
                    key={step.title}
                    className="rounded-[28px] border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface)] shadow-[var(--vooki-shadow-card)]"
                  >
                    <CardContent className="p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-flex rounded-full border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-chip)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-home-text-dim)]">
                            {step.label}
                          </span>
                          <h3 className="mt-5 text-2xl font-semibold text-[color:var(--vooki-home-text)]">
                            {step.title}
                          </h3>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--vooki-home-chip)] text-[color:var(--vooki-accent-strong)]">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-4 text-base leading-7 text-[color:var(--vooki-home-text-muted)]">
                        {step.copy}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="rounded-[32px] border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface)] shadow-[var(--vooki-shadow-card)]">
                <CardContent className="p-8 sm:p-10">
                  <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-home-text-faint)]">
                    What it replaces
                  </p>
                  <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-[color:var(--vooki-home-text)] sm:text-4xl">
                    All the scattered parts of creator work, pulled into one calmer place.
                  </h2>
                  <div className="mt-8 flex flex-wrap gap-3 text-sm text-[color:var(--vooki-home-text-soft)]">
                    {[
                      "Scattered DMs",
                      "Spreadsheet follow-ups",
                      "Loose deal notes",
                      "Hidden delivery feedback",
                      "Payout confusion",
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-chip)] px-4 py-2"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface)] shadow-[var(--vooki-shadow-card)]">
                <CardContent className="p-8">
                  <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-home-text-faint)]">
                    Daily feel
                  </p>
                  <div className="mt-6 space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]">
                        <Handshake className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-[color:var(--vooki-home-text-soft)]">
                          Human first
                        </p>
                        <p className="mt-1 text-sm leading-7 text-[color:var(--vooki-home-text-muted)]">
                          Conversation leads the workflow instead of getting buried under it.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]">
                        <CalendarClock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-[color:var(--vooki-home-text-soft)]">
                          Easy to scan
                        </p>
                        <p className="mt-1 text-sm leading-7 text-[color:var(--vooki-home-text-muted)]">
                          Big type, soft cards, and strong hierarchy help users know what matters in
                          seconds.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--vooki-blue-soft)] text-[color:var(--vooki-blue)]">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-[color:var(--vooki-home-text-soft)]">
                          Operationally clear
                        </p>
                        <p className="mt-1 text-sm leading-7 text-[color:var(--vooki-home-text-muted)]">
                          When money, dates, and delivery matter, the product makes them visible
                          without feeling heavy.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface)] px-6 py-10 shadow-[var(--vooki-shadow-card)] sm:px-8 lg:px-10">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-home-text-faint)]">
                  Get started
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--vooki-home-text)] sm:text-4xl">
                  Pick your role and step into the workspace.
                </h2>
                <p className="mt-4 text-lg leading-8 text-[color:var(--vooki-home-text-muted)]">
                  Start simple. Build the relationship. Let structure appear only when it makes the
                  work easier.
                </p>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {roleLinks.map((role, index) => {
                  const accents = [
                    "var(--vooki-accent-strong)",
                    "var(--vooki-violet)",
                    "var(--vooki-blue)",
                  ];

                  return (
                    <Link key={role.title} href={role.href}>
                      <Card className="h-full rounded-[28px] border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface-muted)] transition-transform duration-200 hover:-translate-y-1 hover:bg-[color:var(--vooki-home-surface-hover)]">
                        <CardContent className="flex h-full flex-col p-7">
                          <span
                            className="mb-5 h-2.5 w-12 rounded-full"
                            style={{ backgroundColor: accents[index] }}
                          />
                          <h3 className="text-2xl font-semibold text-[color:var(--vooki-home-text)]">
                            {role.title}
                          </h3>
                          <p className="mt-3 flex-1 text-base leading-7 text-[color:var(--vooki-home-text-muted)]">
                            {role.description}
                          </p>
                          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[color:var(--vooki-home-text)]">
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="faq" className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:px-8 lg:pb-24">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--vooki-home-text-faint)]">
                FAQ
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--vooki-home-text)] sm:text-4xl">
                A few things people usually want to know first.
              </h2>
            </div>

            <div className="mt-10 space-y-4">
              {faqs.map((faq, index) => (
                <Collapsible
                  key={faq.question}
                  open={openFaq === index}
                  onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer rounded-[24px] border border-[color:var(--vooki-home-border)] bg-[color:var(--vooki-home-surface)] transition-colors hover:bg-[color:var(--vooki-home-surface-strong)]">
                      <CardContent className="flex items-center justify-between gap-6 p-6">
                        <h3 className="text-left text-lg font-medium text-[color:var(--vooki-home-text)]">
                          {faq.question}
                        </h3>
                        <ChevronDown
                          className={`h-5 w-5 flex-shrink-0 text-[color:var(--vooki-home-text-subtle)] transition-transform ${
                            openFaq === index ? "rotate-180" : ""
                          }`}
                        />
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-2 pt-3">
                      <p className="rounded-[20px] border border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-surface-muted)] px-5 py-5 text-base leading-7 text-[color:var(--vooki-home-text-muted)]">
                        {faq.answer}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-[color:var(--vooki-home-border-soft)] bg-[color:var(--vooki-home-bg-strong)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 text-sm text-[color:var(--vooki-home-text-faint)] sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div>
              <p className="text-lg font-semibold text-[color:var(--vooki-home-text)]">Vooki</p>
              <p className="mt-2 max-w-md leading-7 text-[color:var(--vooki-home-text-dim)]">
                A creator collaboration ecosystem designed to feel modern, calm, and worth opening
                every day.
              </p>
            </div>
            <div className="flex flex-wrap gap-5">
              <Link
                href="/signin"
                className="transition-colors hover:text-[color:var(--vooki-home-text)]"
              >
                Sign in
              </Link>
              <Link
                href="/signup/role"
                className="transition-colors hover:text-[color:var(--vooki-home-text)]"
              >
                Create account
              </Link>
              <Link
                href="#faq"
                className="transition-colors hover:text-[color:var(--vooki-home-text)]"
              >
                FAQ
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

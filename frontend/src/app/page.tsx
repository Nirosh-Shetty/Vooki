"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* ─────────────────────────────────────────────
   Scroll-triggered fade-in wrapper
   ───────────────────────────────────────────── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mess chips data
   ───────────────────────────────────────────── */
const messChips = [
  { label: "Instagram DMs", rotate: -3, x: 0, y: 0 },
  { label: "WhatsApp", rotate: 2, x: 1, y: 0 },
  { label: "Email threads", rotate: -1, x: 2, y: 0 },
  { label: "Google Drive", rotate: 4, x: 0, y: 1 },
  { label: '"Did you post it?"', rotate: -2, x: 1, y: 1 },
  { label: "Spreadsheets", rotate: 3, x: 2, y: 1 },
  { label: "Payment screenshots", rotate: -4, x: 0, y: 2 },
  { label: '"When do I get paid?"', rotate: 1, x: 1, y: 2 },
  { label: "Contract PDFs", rotate: -3, x: 2, y: 2 },
  { label: '"Can you send the brief again?"', rotate: 2, x: 0, y: 3 },
  { label: "Content approvals", rotate: -1, x: 1, y: 3 },
  { label: "Follow-up #4", rotate: 5, x: 2, y: 3 },
];

/* ─────────────────────────────────────────────
   Flow steps
   ───────────────────────────────────────────── */
const flowSteps = [
  "Discover",
  "Invite",
  "Negotiate",
  "Agree",
  "Create",
  "Review",
  "Pay",
  "Measure",
];

/* ═════════════════════════════════════════════
   LANDING PAGE
   ═════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        background: "var(--vooki-home-bg)",
        color: "var(--vooki-home-text)",
        minHeight: "100vh",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ─── NAVIGATION ─── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "var(--vooki-home-nav)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--vooki-home-border-soft)" : "1px solid transparent",
          transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--vooki-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--vooki-home-bg)",
                position: "absolute",
                top: "35%",
                left: "50%",
                transform: "translate(-30%, -30%)",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--vooki-home-text)",
            }}
          >
            vooki
          </span>
        </Link>

        {/* Nav actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/signin"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--vooki-home-text-muted)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--vooki-home-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--vooki-home-text-muted)")}
          >
            Log in
          </Link>
          <Link
            href="/signin"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--vooki-accent-text)",
              background: "var(--vooki-accent)",
              padding: "8px 20px",
              borderRadius: 8,
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════
         SECTION 1 — HERO
         ═══════════════════════════════════════ */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle glow behind hero */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            background: "var(--vooki-home-glow-green)",
            borderRadius: "50%",
            filter: "blur(120px)",
            pointerEvents: "none",
          }}
        />

        <Reveal>
          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              maxWidth: 780,
              margin: "0 auto",
              position: "relative",
            }}
          >
            Creator–brand collaborations
            <br />
            shouldn&apos;t be this complicated.
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              color: "var(--vooki-home-text-muted)",
              maxWidth: 520,
              margin: "28px auto 0",
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            One place for the entire collaboration — from the first message to the last payment.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 48,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link
              href="/signin"
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--vooki-accent-text)",
                background: "var(--vooki-accent)",
                padding: "14px 32px",
                borderRadius: 10,
                textDecoration: "none",
                transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Get Started
            </Link>
            <button
              onClick={scrollToHowItWorks}
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "var(--vooki-home-text-muted)",
                background: "transparent",
                padding: "14px 32px",
                borderRadius: 10,
                border: "1px solid var(--vooki-home-border)",
                cursor: "pointer",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--vooki-home-text)";
                e.currentTarget.style.borderColor = "var(--vooki-home-text-faint)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--vooki-home-text-muted)";
                e.currentTarget.style.borderColor = "var(--vooki-home-border)";
              }}
            >
              See how it works
            </button>
          </div>
        </Reveal>

        {/* Hero visual — conceptual flow */}
        <Reveal delay={400}>
          <div
            style={{
              marginTop: 80,
              position: "relative",
              width: "100%",
              maxWidth: 640,
            }}
          >
            <svg
              viewBox="0 0 640 120"
              fill="none"
              style={{ width: "100%", height: "auto" }}
            >
              {/* Flow line */}
              <path
                d="M 80 60 C 160 20, 240 100, 320 60 C 400 20, 480 100, 560 60"
                stroke="var(--vooki-home-border)"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Creator circle (left) */}
              <circle cx="80" cy="60" r="22" fill="var(--vooki-accent)" opacity="0.9" />
              <text
                x="80"
                y="100"
                textAnchor="middle"
                fill="var(--vooki-home-text-muted)"
                fontSize="11"
                fontWeight="500"
              >
                Creator
              </text>
              {/* Brand circle (right) */}
              <circle cx="560" cy="60" r="22" fill="var(--vooki-home-text)" opacity="0.15" />
              <circle cx="560" cy="60" r="22" stroke="var(--vooki-home-text)" strokeWidth="1.5" fill="none" opacity="0.4" />
              <text
                x="560"
                y="100"
                textAnchor="middle"
                fill="var(--vooki-home-text-muted)"
                fontSize="11"
                fontWeight="500"
              >
                Brand
              </text>
              {/* Mid-point nodes */}
              {["Deal", "Content", "Payment"].map((label, i) => {
                const cx = 200 + i * 120;
                // Calculate y position on the curve
                const t = (i + 1) / 4;
                const curveY = 60 + Math.sin(t * Math.PI * 2) * 25;
                return (
                  <g key={label}>
                    <circle cx={cx} cy={curveY} r="5" fill="var(--vooki-accent)" opacity="0.6" />
                    <text
                      x={cx}
                      y={curveY - 14}
                      textAnchor="middle"
                      fill="var(--vooki-home-text-faint)"
                      fontSize="10"
                      fontWeight="500"
                      letterSpacing="0.04em"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 2 — THE MESS
         ═══════════════════════════════════════ */}
      <section
        style={{
          padding: "120px 24px 100px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <Reveal>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              textAlign: "center",
              marginBottom: 64,
            }}
          >
            You already know how this goes.
          </h2>
        </Reveal>

        {/* Scattered chips */}
        <Reveal delay={150}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "10px 12px",
              maxWidth: 720,
              margin: "0 auto",
              padding: "20px 0",
            }}
          >
            {messChips.map((chip, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  padding: "10px 18px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--vooki-home-text-muted)",
                  background: "var(--vooki-home-surface-muted)",
                  border: "1px solid var(--vooki-home-border-soft)",
                  borderRadius: 8,
                  transform: `rotate(${chip.rotate}deg)`,
                  whiteSpace: "nowrap",
                  transition: "transform 0.3s, background 0.3s",
                }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={300}>
          <p
            style={{
              textAlign: "center",
              fontSize: "clamp(16px, 2vw, 20px)",
              color: "var(--vooki-home-text-faint)",
              marginTop: 56,
              fontWeight: 400,
            }}
          >
            Both sides lose context. Every time.
          </p>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 3 — THE IDEA
         ═══════════════════════════════════════ */}
      <section
        style={{
          padding: "120px 24px",
          maxWidth: 900,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <Reveal>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              marginBottom: 56,
            }}
          >
            Everything about the collaboration.
            <br />
            <span style={{ color: "var(--vooki-accent)" }}>In one place.</span>
          </h2>
        </Reveal>

        {/* Ordered flow */}
        <Reveal delay={150}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              flexWrap: "wrap",
              padding: "32px 0",
            }}
          >
            {flowSteps.map((step, i) => (
              <div
                key={step}
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: i === 0 || i === flowSteps.length - 1
                      ? "var(--vooki-accent)"
                      : "var(--vooki-home-text)",
                    letterSpacing: "-0.01em",
                    padding: "8px 0",
                  }}
                >
                  {step}
                </span>
                {i < flowSteps.length - 1 && (
                  <span
                    style={{
                      margin: "0 14px",
                      color: "var(--vooki-home-text-faint)",
                      fontSize: 14,
                      opacity: 0.5,
                    }}
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={250}>
          <p
            style={{
              fontSize: "clamp(15px, 1.8vw, 18px)",
              color: "var(--vooki-home-text-muted)",
              maxWidth: 560,
              margin: "32px auto 0",
              lineHeight: 1.7,
            }}
          >
            Vooki brings the entire collaboration lifecycle into one workspace.
            No scattered DMs. No lost files. No chasing payments.
          </p>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 4 — HOW IT WORKS
         ═══════════════════════════════════════ */}
      <section
        id="how-it-works"
        style={{
          padding: "120px 24px",
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 48,
          }}
        >
          {[
            {
              title: "Find the right creator.",
              description:
                "Search by niche, platform, reach, engagement — or browse actual work. Not just follower counts.",
            },
            {
              title: "Make the deal clear.",
              description:
                "Send a structured invite. Negotiate openly. Agree on terms both sides can see.",
            },
            {
              title: "Track everything that matters.",
              description:
                "Deliverables. Approvals. Payments. Performance. All in the collaboration workspace.",
            },
          ].map((moment, i) => (
            <Reveal key={i} delay={i * 120}>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--vooki-accent)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                    opacity: 0.8,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3
                  style={{
                    fontSize: "clamp(22px, 3vw, 28px)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    marginBottom: 14,
                  }}
                >
                  {moment.title}
                </h3>
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.65,
                    color: "var(--vooki-home-text-muted)",
                    fontWeight: 400,
                  }}
                >
                  {moment.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 5 — TWO SIDES
         ═══════════════════════════════════════ */}
      <section
        style={{
          padding: "120px 24px",
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 64,
          }}
        >
          {/* Creator side */}
          <Reveal>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "var(--vooki-accent)",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--vooki-accent)",
                  }}
                >
                  For creators
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {[
                  "See real offers, not vague DMs",
                  "Know exactly what's expected",
                  "Get paid on time, with visibility",
                  "Build a portfolio that proves your work",
                ].map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 17,
                      lineHeight: 1.5,
                      color: "var(--vooki-home-text-soft)",
                      fontWeight: 400,
                      paddingLeft: 20,
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 4,
                        color: "var(--vooki-home-text-faint)",
                        fontSize: 14,
                      }}
                    >
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Brand side */}
          <Reveal delay={150}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "var(--vooki-home-text-muted)",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--vooki-home-text-muted)",
                  }}
                >
                  For brands
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {[
                  "Find creators based on actual content",
                  "Negotiate in one place",
                  "Manage deliverables without spreadsheets",
                  "See what your money delivered",
                ].map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 17,
                      lineHeight: 1.5,
                      color: "var(--vooki-home-text-soft)",
                      fontWeight: 400,
                      paddingLeft: 20,
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 4,
                        color: "var(--vooki-home-text-faint)",
                        fontSize: 14,
                      }}
                    >
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 6 — PHILOSOPHY
         ═══════════════════════════════════════ */}
      <section
        style={{
          padding: "120px 24px",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <Reveal>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              textAlign: "center",
              marginBottom: 80,
            }}
          >
            Built around relationships,
            <br />
            not transactions.
          </h2>
        </Reveal>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 64,
          }}
        >
          {[
            {
              title: "No commission on payments.",
              body: "Brand pays the creator directly. Vooki tracks it.",
            },
            {
              title: "Actual work matters.",
              body: "Creators are evaluated by content quality and performance — not just followers.",
            },
            {
              title: "The whole lifecycle.",
              body: "From the first discovery to the fifth collaboration. Every interaction in one place.",
            },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 100}>
              <div
                style={{
                  borderLeft: "2px solid var(--vooki-home-border)",
                  paddingLeft: 28,
                }}
              >
                <h3
                  style={{
                    fontSize: "clamp(18px, 2.5vw, 24px)",
                    fontWeight: 700,
                    letterSpacing: "-0.015em",
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 17,
                    color: "var(--vooki-home-text-muted)",
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
         SECTION 7 — FINAL CTA
         ═══════════════════════════════════════ */}
      <section
        style={{
          padding: "120px 24px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 500,
            background: "var(--vooki-home-glow-green)",
            borderRadius: "50%",
            filter: "blur(140px)",
            pointerEvents: "none",
            opacity: 0.7,
          }}
        />

        <Reveal>
          <h2
            style={{
              fontSize: "clamp(28px, 4.5vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 40,
              position: "relative",
            }}
          >
            Ready to make collaborations
            <br />
            simpler?
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <Link
            href="/signin"
            style={{
              display: "inline-block",
              fontSize: 17,
              fontWeight: 600,
              color: "var(--vooki-accent-text)",
              background: "var(--vooki-accent)",
              padding: "16px 40px",
              borderRadius: 10,
              textDecoration: "none",
              position: "relative",
              transition: "opacity 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Join Vooki
          </Link>
        </Reveal>

        <Reveal delay={200}>
          <p
            style={{
              fontSize: 14,
              color: "var(--vooki-home-text-faint)",
              marginTop: 20,
              fontWeight: 400,
              position: "relative",
            }}
          >
            Free to join. No commission on your collaborations.
          </p>
        </Reveal>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          padding: "48px 24px",
          textAlign: "center",
          borderTop: "1px solid var(--vooki-home-border-soft)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--vooki-accent)",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--vooki-home-bg)",
                position: "absolute",
                top: "35%",
                left: "50%",
                transform: "translate(-30%, -30%)",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--vooki-home-text-muted)",
              letterSpacing: "-0.01em",
            }}
          >
            vooki
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--vooki-home-text-faint)",
            fontWeight: 400,
          }}
        >
          © {new Date().getFullYear()} Vooki. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

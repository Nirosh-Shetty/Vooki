"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ChevronDown, ThumbsUp, XCircle } from "lucide-react";
import { CounterOfferModal } from "./CounterOfferModal";
import { DeclineConfirmDialog } from "./DeclineConfirmDialog";

interface InviteCardProps {
  invite: any;
  brand: {
    id: string;
    name: string;
    profilePicture?: string;
    brandName?: string;
  };
  onAction?: () => void;
}

const statusMap: Record<string, string> = {
  pending: "bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]",
  counter_offered: "bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]",
  accepted: "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]",
  declined: "bg-[color:var(--vooki-app-surface-hover)] text-[color:var(--vooki-app-text-soft)]",
};

export function InviteCard({ invite, brand, onAction }: InviteCardProps) {
  const [loading, setLoading] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collaborations/invites/${invite._id}/accept`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to accept invite");

      onAction?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const activeTerms = invite.activeCounterOffer || invite;
  const compensation = activeTerms.compensation || {};
  const collaborationTypeText = invite.collaborationType
    ? invite.collaborationType.replace(/_/g, " ").charAt(0).toUpperCase() +
      invite.collaborationType.replace(/_/g, " ").slice(1)
    : "Collaboration";
  const totalDeliverables = Array.isArray(activeTerms.deliverables)
    ? activeTerms.deliverables.reduce(
        (sum: number, deliverable: any) => sum + (deliverable?.quantity || 0),
        0
      )
    : 0;
  const deliveryItems = Array.isArray(activeTerms.deliverables) ? activeTerms.deliverables : [];
  const responseDeadline = invite.timeline?.responseDeadline
    ? new Date(invite.timeline.responseDeadline).toLocaleDateString()
    : "TBD";
  const postingEndDate = invite.timeline?.postingEndDate
    ? new Date(invite.timeline.postingEndDate).toLocaleDateString()
    : null;
  const draftDueDate = invite.timeline?.draftDueDate
    ? new Date(invite.timeline.draftDueDate).toLocaleDateString()
    : null;
  const compensationText =
    compensation.type === "fixed"
      ? compensation.amount != null
        ? `Rs ${compensation.amount.toLocaleString()}`
        : "N/A"
      : compensation.minAmount != null && compensation.maxAmount != null
        ? `Rs ${compensation.minAmount.toLocaleString()} - ${compensation.maxAmount.toLocaleString()}`
        : "N/A";

  const statusBadgeStyle = statusMap[invite.status as string] || statusMap.pending;
  
  const isWaitingForBrand = invite.status === "counter_offered" && invite.activeCounterOffer?.createdBy === "creator";

  const statusLabel =
    invite.status === "counter_offered"
      ? isWaitingForBrand ? "Waiting for Brand" : "Brand Countered"
      : invite.status.charAt(0).toUpperCase() + invite.status.slice(1);

  return (
    <>
      <Card
        className={`relative overflow-hidden rounded-[20px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] transition-all duration-200 hover:shadow-sm ${
          invite.status === "pending"
            ? "ring-1 ring-[color:var(--vooki-app-glow-green)] shadow-[var(--vooki-shadow-accent)]"
            : ""
        }`}
      >
        {invite.status === "pending" && (
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[color:var(--vooki-app-glow-green)]/10 to-transparent opacity-50 blur-xl" />
        )}
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Brand Identity & Campaign Title */}
            <div className="flex flex-1 items-center gap-3">
              <Avatar className="h-10 w-10 border border-[color:var(--vooki-app-border)]">
                <AvatarImage src={brand.profilePicture} />
                <AvatarFallback className="bg-[color:var(--vooki-violet-soft)] text-sm font-semibold text-[color:var(--vooki-violet)]">
                  {getInitials(brand.brandName || brand.name, "B")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    {invite.campaignTitle || "Collaboration Invite"}
                  </h3>
                  <Badge className={`border-0 font-medium px-2 py-0.5 text-[10px] shadow-none ${statusBadgeStyle}`}>
                    {statusLabel}
                  </Badge>
                </div>
                <p className="text-xs text-[color:var(--vooki-app-text-soft)] mt-0.5">
                  {brand.brandName || brand.name || "Brand"}
                </p>
              </div>
            </div>

            {/* Right: Compensation & Actions */}
            <div className="flex items-center justify-between lg:justify-end gap-6 mt-2 lg:mt-0">
              <div className="flex flex-col items-start lg:items-end">
                <p className="text-lg font-bold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                  {compensationText}
                </p>
                <p className="text-[10px] font-medium text-[color:var(--vooki-app-text-muted)] uppercase tracking-wider">
                  {collaborationTypeText}
                </p>
              </div>

              {/* Quick Stats (Desktop) */}
              <div className="hidden xl:flex items-center gap-4 border-l border-[color:var(--vooki-app-border)] pl-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--vooki-app-text-muted)]">
                    Deliverables
                  </span>
                  <span className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">
                    {totalDeliverables} items
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--vooki-app-text-muted)]">
                    Deadline
                  </span>
                  <span className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">
                    {responseDeadline}
                  </span>
                </div>
              </div>

              {/* Primary Actions (Desktop) */}
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-8 w-8 rounded-full p-0 text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]"
                  onClick={() => setExpandedDetails(!expandedDetails)}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${expandedDetails ? "rotate-180" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats (Mobile) */}
          <div className="mt-4 flex xl:hidden items-center gap-4 rounded-xl bg-[color:var(--vooki-app-surface-strong)]/50 border border-[color:var(--vooki-app-border)]/50 px-4 py-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--vooki-app-text-muted)]">
                Deliverables
              </span>
              <span className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">
                {totalDeliverables} items
              </span>
            </div>
            <div className="h-6 w-px bg-[color:var(--vooki-app-border)]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--vooki-app-text-muted)]">
                Deadline
              </span>
              <span className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">
                {responseDeadline}
              </span>
            </div>
          </div>

          {invite.brandMessage && (
            <div className="mt-4 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-3 text-xs leading-relaxed text-[color:var(--vooki-app-text-soft)]">
              <strong className="text-[color:var(--vooki-app-text-strong)]">{brand.brandName || brand.name}: </strong>
              {invite.brandMessage}
            </div>
          )}

          {expandedDetails && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)]/30 p-4 animate-in slide-in-from-top-2 fade-in duration-200">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-strong)] border-b border-[color:var(--vooki-app-border)] pb-1">
                  Deliverables
                </p>
                <div className="space-y-2">
                  {deliveryItems.length > 0 ? (
                    deliveryItems.map((deliverable: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-lg bg-[color:var(--vooki-app-surface-card)] p-2 border border-[color:var(--vooki-app-border)]/50"
                      >
                        <Badge variant="outline" className="shrink-0 bg-[color:var(--vooki-app-surface-strong)] border-0 text-[10px] px-1.5 py-0">
                          {deliverable.quantity}x
                        </Badge>
                        <div className="text-xs">
                          <p className="font-semibold text-[color:var(--vooki-app-text-strong)]">{deliverable.format} <span className="text-[color:var(--vooki-app-text-muted)] font-normal">on</span> {deliverable.platform}</p>
                          {deliverable.description && <p className="mt-0.5 text-[color:var(--vooki-app-text-soft)]">{deliverable.description}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[color:var(--vooki-app-text-soft)] italic">
                      No specific deliverables listed.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--vooki-app-text-strong)] border-b border-[color:var(--vooki-app-border)] pb-1">
                  Key Dates
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between rounded-lg bg-[color:var(--vooki-app-surface-card)] p-2 border border-[color:var(--vooki-app-border)]/50">
                    <span className="text-xs text-[color:var(--vooki-app-text-soft)]">Post by</span>
                    <span className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">{postingEndDate || "TBD"}</span>
                  </div>
                  {draftDueDate && (
                    <div className="flex justify-between rounded-lg bg-[color:var(--vooki-app-surface-card)] p-2 border border-[color:var(--vooki-app-border)]/50">
                      <span className="text-xs text-[color:var(--vooki-app-text-soft)]">Draft due</span>
                      <span className="text-xs font-semibold text-[color:var(--vooki-app-text-strong)]">{draftDueDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[color:var(--vooki-app-border)]/50 pt-4">
            <Button
              variant="ghost"
              className="lg:hidden h-8 w-8 rounded-full p-0 text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)] shrink-0"
              onClick={() => setExpandedDetails(!expandedDetails)}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${expandedDetails ? "rotate-180" : ""}`}
              />
            </Button>

            {invite.status === "pending" || (invite.status === "counter_offered" && !isWaitingForBrand) ? (
              <div className="flex flex-wrap flex-1 gap-2 justify-end lg:justify-start w-full">
                <Button
                  className="h-9 rounded-xl border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] px-5 text-sm font-semibold text-[color:var(--vooki-accent-text)] shadow-sm hover:bg-[color:var(--vooki-accent-strong)] hover:-translate-y-0.5 transition-transform"
                  onClick={handleAccept}
                  disabled={loading}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Accept Invite
                </Button>

                <Button
                  variant="outline"
                  className="h-9 rounded-xl border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-card)] px-4 text-sm font-semibold text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-strong)]"
                  onClick={() => setShowCounter(true)}
                >
                  <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                  Counter Offer
                </Button>

                <Button
                  variant="ghost"
                  className="h-9 rounded-xl px-4 text-sm font-semibold text-[color:var(--vooki-warm)] hover:bg-[color:var(--vooki-warm-soft)] hover:text-[color:var(--vooki-warm)] ml-auto sm:ml-0"
                  onClick={() => setShowDecline(true)}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Decline
                </Button>
              </div>
            ) : (
              <p className="flex-1 rounded-xl bg-[color:var(--vooki-app-surface-strong)] px-4 py-2 text-xs font-medium text-[color:var(--vooki-app-text-soft)] border border-[color:var(--vooki-app-border)]/50">
                {invite.status === "accepted" && "✅ You accepted this invite."}
                {invite.status === "declined" && "❌ You declined this invite."}
                {isWaitingForBrand && "⏳ Waiting for brand approval on counter offer."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <CounterOfferModal
        inviteId={invite._id}
        currentTerms={activeTerms}
        open={showCounter}
        onOpenChange={setShowCounter}
        onSuccess={onAction}
      />
      <DeclineConfirmDialog
        inviteId={invite._id}
        open={showDecline}
        onOpenChange={setShowDecline}
        onSuccess={onAction}
      />
    </>
  );
}

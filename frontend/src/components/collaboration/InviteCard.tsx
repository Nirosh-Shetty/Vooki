"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      <Card className="rounded-[30px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)] transition-transform hover:-translate-y-0.5">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Avatar className="h-11 w-11 border border-[color:var(--vooki-app-border)]">
                <AvatarImage src={brand.profilePicture} />
                <AvatarFallback className="bg-[color:var(--vooki-violet-soft)] text-[color:var(--vooki-violet)]">
                  {(brand.brandName || brand.name || "B").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold tracking-tight text-[color:var(--vooki-app-text-strong)]">
                    {invite.campaignTitle || "Collaboration invite"}
                  </h3>
                  <Badge className={`border-0 hover:opacity-100 ${statusBadgeStyle}`}>
                    {statusLabel}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                  {brand.brandName || brand.name || "Brand"}
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-xl font-semibold text-[color:var(--vooki-app-text-strong)]">
                {compensationText}
              </p>
              <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                {collaborationTypeText}
              </p>
            </div>
          </div>

          {invite.brandMessage ? (
            <div className="mt-5 rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4 text-sm leading-6 text-[color:var(--vooki-app-text-soft)]">
              {invite.brandMessage}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoBlock label="Deliverables" value={`${totalDeliverables} items`} />
            <InfoBlock label="Response deadline" value={responseDeadline} />
          </div>

          {expandedDetails ? (
            <div className="mt-5 space-y-4 rounded-[24px] border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-app-text-muted)]">
                  Deliverables
                </p>
                <div className="mt-3 space-y-2">
                  {deliveryItems.length > 0 ? (
                    deliveryItems.map((deliverable: any, index: number) => (
                      <div
                        key={index}
                        className="text-sm leading-6 text-[color:var(--vooki-app-text-soft)]"
                      >
                        {deliverable.quantity}x {deliverable.format} ({deliverable.platform})
                        {deliverable.description ? ` - ${deliverable.description}` : ""}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[color:var(--vooki-app-text-soft)]">
                      No deliverables specified
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-app-text-muted)]">
                  Timeline
                </p>
                <div className="mt-3 space-y-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                  <p>Post by: {postingEndDate || "TBD"}</p>
                  {draftDueDate ? <p>Draft due: {draftDueDate}</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          <Button
            variant="ghost"
            className="mt-4 h-10 w-full rounded-full text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]"
            onClick={() => setExpandedDetails(!expandedDetails)}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expandedDetails ? "rotate-180" : ""}`}
            />
          </Button>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {invite.status === "pending" || (invite.status === "counter_offered" && !isWaitingForBrand) ? (
              <>
                <Button
                  className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
                  onClick={handleAccept}
                  disabled={loading}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept
                </Button>

                <Button
                  variant="ghost"
                  className="rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
                  onClick={() => setShowCounter(true)}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Counter
                </Button>

                <Button
                  variant="ghost"
                  className="rounded-full text-[color:var(--vooki-warm)] hover:bg-[color:var(--vooki-warm-soft)] hover:text-[color:var(--vooki-warm)]"
                  onClick={() => setShowDecline(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </>
            ) : (
              <p className="w-full rounded-2xl bg-[color:var(--vooki-app-surface-strong)] px-4 py-3 text-center text-sm text-[color:var(--vooki-app-text-soft)]">
                {invite.status === "accepted" && "You accepted this invite"}
                {invite.status === "declined" && "You declined this invite"}
                {isWaitingForBrand && "Waiting for the brand to review your counter offer"}
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--vooki-app-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[color:var(--vooki-app-text-strong)]">{value}</p>
    </div>
  );
}

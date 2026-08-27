/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchPeopleDialog } from "./search-people-dialog";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Circle,
  Dot,
  Loader2,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
} from "lucide-react";
import { CounterOfferModal } from "@/components/collaboration/CounterOfferModal";
import { DeclineConfirmDialog } from "@/components/collaboration/DeclineConfirmDialog";

export type RoleVariant = "influencer" | "brand" | "manager";

interface HubOfferData {
  inviteId?: string;
  campaignId?: string;
  promotionId?: string;
  campaignTitle?: string;
  deliverableSummary?: string;
  paymentAmount?: number;
  advanceAmount?: number;
  postAt?: string | Date | null;
  hashtags?: string[];
  discountCode?: string;
  note?: string;
}

export interface HubConversation {
  id: string;
  name: string;
  context: string;
  avatar?: string;
  profileURL?: string | null;
  icon?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: "active" | "pending" | "closed";
  online: boolean;
  threadType?: "direct" | "campaign" | "collaboration";
  campaignId?: string;
  promotionId?: string;
  inviteId?: string;
  campaignTitle?: string;
  invites?: Record<string, { id: string; status: string; campaignId: string }>;
}

export interface HubMessage {
  id: string;
  sender: "me" | "other";
  text: string;
  messageType?: "text" | "offer" | "counter_offer" | "system";
  offerData?: HubOfferData | null;
  timestamp: string;
  read: boolean;
}

type StructuredMessageAction = "accept_offer" | "request_changes";

interface MessagesHubProps {
  role: RoleVariant;
  composerPlaceholder: string;
  conversations: HubConversation[];
  messagesByConversation: Record<string, HubMessage[]>;
  selectedConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onSendMessage?: (text: string) => void;
  onStructuredMessageAction?: (
    action: StructuredMessageAction,
    payload: { conversation: HubConversation; message: HubMessage }
  ) => Promise<void> | void;
  onCreateConversation?: (userId: string) => Promise<void>;
  isLoading?: boolean;
  initialDraft?: string;
}

const statusDotStyles: Record<HubConversation["status"], string> = {
  active: "text-[color:var(--vooki-accent-strong)]",
  pending: "text-[color:var(--vooki-warm)]",
  closed: "text-[color:var(--vooki-app-text-muted)]",
};

const formatMoney = (value?: number) => {
  if (!value) return "Not set";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const avatarPalette = [
  "#7c3aed",
  "#2563eb",
  "#0f766e",
  "#d97706",
  "#db2777",
  "#059669",
  "#b45309",
  "#4f46e5",
  "#be185d",
  "#0284c7",
] as const;

const getAvatarInitial = (conversation: Pick<HubConversation, "name" | "avatar">) => {
  const fallback = conversation.avatar?.trim();
  if (fallback && fallback !== "??") return fallback;
  return conversation.name?.trim()?.charAt(0)?.toUpperCase() || "?";
};

const getAvatarStyle = (conversation: Pick<HubConversation, "id" | "name" | "avatar">) => {
  const seed = `${conversation.id || ""}${conversation.name || ""}${conversation.avatar || ""}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  const paletteIndex = Math.abs(hash) % avatarPalette.length;
  return { backgroundColor: avatarPalette[paletteIndex], color: "#ffffff" };
};

function ConversationAvatar({
  conversation,
  online,
  size = "md",
}: {
  conversation: Pick<HubConversation, "id" | "name" | "avatar" | "profileURL" | "icon">;
  online?: boolean;
  size?: "sm" | "md";
}) {
  const [imgError, setImgError] = useState(false);
  const potentialPic =
    conversation.profileURL ||
    (conversation.avatar?.startsWith("http") ||
    conversation.avatar?.startsWith("/") ||
    conversation.avatar?.startsWith("data:")
      ? conversation.avatar
      : null);
  const imageUrl = !imgError && potentialPic ? potentialPic.trim() : null;
  const isImage = Boolean(imageUrl);
  const label = getAvatarInitial(conversation);
  const avatarStyle = getAvatarStyle(conversation);
  const sizeClasses = size === "sm"
    ? "h-10 w-10 sm:h-11 sm:w-11 rounded-full text-xs sm:text-sm"
    : "h-11 w-11 rounded-full text-sm";
  const badgeClass = size === "sm"
    ? "h-2.5 w-2.5 sm:h-3 sm:w-3"
    : "h-3 w-3";

  return (
    <div className="relative shrink-0">
      <div
        className={`flex items-center justify-center overflow-hidden border border-white/20 font-semibold ${sizeClasses}`}
        style={isImage ? undefined : avatarStyle}
      >
        {isImage ? (
          <img
            src={imageUrl!}
            alt={conversation.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : conversation.icon && conversation.icon.length <= 2 ? (
          <span>{conversation.icon}</span>
        ) : (
          <span>{label}</span>
        )}
      </div>
      {online ? (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[color:var(--vooki-app-surface-card)] bg-[color:var(--vooki-accent)] ${badgeClass}`}
        />
      ) : null}
    </div>
  );
}

const getCollaborationHref = (role: RoleVariant, promotionId?: string) => {
  if (!promotionId) return null;
  if (role === "brand") return `/brand/promotions/${promotionId}`;
  if (role === "influencer") return `/influencer/my-collabs/${promotionId}`;
  return null;
};

function StructuredOfferCard({ message, actions }: { message: HubMessage; actions?: ReactNode }) {
  const isMine = message.sender === "me";
  const isCounter = message.messageType === "counter_offer";
  const offer = message.offerData || null;
  const wrapperClass = isMine
    ? "border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-app-text-strong)]"
    : "border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)]";
  const badgeClass = isCounter
    ? "bg-[color:var(--vooki-warm-soft)] text-[color:var(--vooki-warm)]"
    : "bg-[color:var(--vooki-accent-soft)] text-[color:var(--vooki-accent-strong)]";

  return (
    <div className={`max-w-[88%] rounded-2xl border p-4 shadow-sm ${wrapperClass}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`border-0 ${badgeClass}`}>{isCounter ? "Change request" : "Offer"}</Badge>
        <span className="text-xs font-medium opacity-80">
          {offer?.campaignTitle || "Collaboration"}
        </span>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <p className="text-sm font-semibold">
            {isCounter ? "Let's revise the agreement" : "Here's the current collaboration proposal"}
          </p>
          {offer?.note ? <p className="mt-1 text-sm opacity-90">{offer.note}</p> : null}
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-current/10 bg-[color:var(--vooki-app-surface-card)] px-3 py-2 ">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Deliverable</p>
            <p className="mt-1 font-medium">{offer?.deliverableSummary || "To be confirmed"}</p>
          </div>
          <div className="rounded-xl border border-current/10 bg-[color:var(--vooki-app-surface-card)] px-3 py-2 ">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Compensation</p>
            <p className="mt-1 font-medium">{formatMoney(offer?.paymentAmount)}</p>
          </div>
          <div className="rounded-xl border border-current/10 bg-[color:var(--vooki-app-surface-card)] px-3 py-2 ">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Advance</p>
            <p className="mt-1 font-medium">
              {offer?.advanceAmount ? formatMoney(offer.advanceAmount) : "No advance"}
            </p>
          </div>
          <div className="rounded-xl border border-current/10 bg-[color:var(--vooki-app-surface-card)] px-3 py-2 ">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Target Posting Date</p>
            <p className="mt-1 font-medium">{formatDate(offer?.postAt)}</p>
          </div>
          <div className="rounded-xl border border-current/10 bg-[color:var(--vooki-app-surface-card)] px-3 py-2 ">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Discount code</p>
            <p className="mt-1 font-medium">{offer?.discountCode || "Not required"}</p>
          </div>
        </div>

        <div className="rounded-xl border border-current/10 bg-[color:var(--vooki-app-surface-card)] px-3 py-2 text-sm ">
          <p className="text-[11px] uppercase tracking-wide opacity-60">Hashtags</p>
          <p className="mt-1 font-medium">
            {offer?.hashtags?.length ? offer.hashtags.join(", ") : "No required hashtags yet"}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] opacity-80">
        <span>{message.timestamp}</span>
        {isMine ? (
          message.read ? (
            <CheckCheck className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3" />
          )
        ) : (
          <Circle className="h-1.5 w-1.5 fill-current stroke-none" />
        )}
      </div>
    </div>
  );
}

export function MessagesHub({
  role,
  composerPlaceholder,
  conversations,
  messagesByConversation,
  selectedConversationId: providedSelectedId,
  onSelectConversation,
  onSendMessage,
  onStructuredMessageAction,
  onCreateConversation,
  isLoading = false,
  initialDraft,
}: MessagesHubProps) {
  const [activeTab, setActiveTab] = useState<HubConversation["status"] | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    providedSelectedId || conversations[0]?.id || null
  );
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [cardActionKey, setCardActionKey] = useState<string | null>(null);
  const [cardActionError, setCardActionError] = useState<string | null>(null);
  const [counterModal, setCounterModal] = useState<{
    open: boolean;
    inviteId: string;
    terms: any;
  } | null>(null);
  const [declineModal, setDeclineModal] = useState<{ open: boolean; inviteId: string } | null>(
    null
  );

  useEffect(() => {
    if (providedSelectedId !== undefined) {
      setSelectedId(providedSelectedId);
    }
  }, [providedSelectedId]);

  useEffect(() => {
    if (!initialDraft) return;
    setDraft((current) => current || initialDraft);
  }, [initialDraft]);

  useEffect(() => {
    setCardActionError(null);
    setCardActionKey(null);
  }, [selectedId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesStatus = activeTab === "all" || conversation.status === activeTab;
      const matchesQuery =
        conversation.name.toLowerCase().includes(query.toLowerCase()) ||
        conversation.context.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [activeTab, conversations, query]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ?? null;
  const selectedMessages = selectedId ? (messagesByConversation[selectedId] ?? []) : [];

  const latestStructuredMessageIdsByInvite = useMemo(() => {
    const structured = selectedMessages.filter(
      (m) => m.messageType === "offer" || m.messageType === "counter_offer"
    );
    const map: Record<string, string> = {};
    for (const m of structured) {
      const key = m.offerData?.inviteId || m.offerData?.campaignId || "default";
      map[key] = m.id;
    }
    return map;
  }, [selectedMessages]);

  const messagesContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedConversation) return;
    const content = messagesContentRef.current;
    if (!content) return;
    content.scrollTop = content.scrollHeight;
  }, [selectedConversation, selectedMessages.length]);

  const openConversation = (id: string) => {
    setSelectedId(id);
    setMobileChatOpen(true);
    onSelectConversation?.(id);
  };

  const sendMessage = () => {
    if (!selectedId || !draft.trim()) return;
    onSendMessage?.(draft.trim());
    setDraft("");
  };

  const handleUserSelected = async (user: any) => {
    try {
      setCreatingConversation(true);
      setCardActionError(null);
      await onCreateConversation?.(user.id);
      setMobileChatOpen(true);
      setSearchDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to create conversation:", error);
      setCardActionError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to start conversation with this user."
      );
      setSearchDialogOpen(false);
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleStructuredAction = async (
    action: StructuredMessageAction | "decline",
    conversation: HubConversation,
    message: HubMessage
  ) => {
    if (action === "request_changes") {
      const activeInviteId = message.offerData?.inviteId || conversation.inviteId;
      if (!activeInviteId) return;
      setCounterModal({
        open: true,
        inviteId: activeInviteId,
        terms: message.offerData || {},
      });
      return;
    }

    if (action === "decline") {
      const activeInviteId = message.offerData?.inviteId || conversation.inviteId;
      if (!activeInviteId) return;
      setDeclineModal({ open: true, inviteId: activeInviteId });
      return;
    }

    if (!onStructuredMessageAction) return;

    setCardActionError(null);
    setCardActionKey(`${message.id}:${action}`);
    try {
      await onStructuredMessageAction(action, { conversation, message });
    } catch (error) {
      setCardActionError(error instanceof Error ? error.message : "Unable to complete that action");
    } finally {
      setCardActionKey(null);
    }
  };

  return (
<div className="mx-auto w-full px-3 pt-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="grid h-[calc(100dvh-13rem)] min-h-[360px] gap-4 sm:h-[calc(100vh-10.5rem)] sm:min-h-[520px] lg:grid-cols-[360px_1fr] lg:h-[calc(100vh-9rem)]">        <Card
          className={`${mobileChatOpen ? "hidden lg:flex" : "flex"} h-full min-h-0 overflow-hidden rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]`}
        >
          <div className="flex h-full min-h-0 w-full flex-col">
            <CardHeader className="space-y-3 border-b border-[color:var(--vooki-app-border-strong)] pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--vooki-app-text-muted)]" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search conversations"
                    className="h-11 rounded-full border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] pl-10 text-[color:var(--vooki-app-text-strong)] placeholder:text-[color:var(--vooki-app-text-muted)]"
                  />
                </div>
                {(role === "brand" || role === "manager") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchDialogOpen(true)}
                    className="h-11 w-11 rounded-full border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as HubConversation["status"] | "all")}
              >
                <TabsList className="grid h-auto w-full grid-cols-4 rounded-[18px] border border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-strong)] p-1">
                  {["all", "active", "pending", "closed"].map((status) => (
                    <TabsTrigger
                      key={status}
                      value={status}
                      className="rounded-2xl text-xs capitalize text-[color:var(--vooki-app-text-soft)] data-[state=active]:bg-[color:var(--vooki-app-active-bg)] data-[state=active]:text-[color:var(--vooki-app-active-text)]"
                    >
                      {status}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 space-y-2 overflow-y-auto p-3">
              {filteredConversations.map((conversation) => {
                const isSelected = selectedId === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className={`w-full rounded-2xl border p-2.5 sm:rounded-[24px] sm:p-3 text-left transition-colors ${
                      isSelected
                        ? "border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent-soft)]"
                        : "border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] hover:bg-[color:var(--vooki-app-surface-hover)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <ConversationAvatar
                        conversation={conversation}
                        online={conversation.online}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                          <p className="truncate text-xs sm:text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                            {conversation.name}
                          </p>
                          <span className="text-[10px] sm:text-xs text-[color:var(--vooki-app-text-muted)]">
                            {conversation.lastMessageAt}
                          </span>
                        </div>
                        <p className="truncate text-[11px] sm:text-xs text-[color:var(--vooki-app-text-muted)]">
                          {conversation.context}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="truncate text-[11px] sm:text-xs text-[color:var(--vooki-app-text-soft)]">
                            {conversation.lastMessage}
                          </p>
                          <div className="ml-2 flex items-center gap-1.5">
                            <Dot className={`h-4 w-4 ${statusDotStyles[conversation.status]}`} />
                            {conversation.unreadCount > 0 && !isSelected ? (
                              <Badge className="border-0 bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] hover:bg-[color:var(--vooki-accent)] px-1.5 py-0 text-[10px]">
                                {conversation.unreadCount}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </div>
        </Card>

        <Card
          className={`${mobileChatOpen ? "flex" : "hidden lg:flex"} h-full min-h-0 overflow-hidden rounded-[32px] border-[color:var(--vooki-app-border)] bg-[color:var(--vooki-app-surface-card)] shadow-[var(--vooki-shadow-app)]`}
        >
          <div className="flex h-full min-h-0 w-full flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b border-[color:var(--vooki-app-border-strong)] pb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]"
                      onClick={() => {
                        setMobileChatOpen(false);
                        setSelectedId(null);
                        onSelectConversation?.("");
                      }}
                      title="Back"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <ConversationAvatar
                      conversation={selectedConversation}
                      online={selectedConversation.online}
                      size="md"
                    />
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base text-[color:var(--vooki-app-text-strong)]">
                        {selectedConversation.name}
                      </CardTitle>
                      <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                        {selectedConversation.context}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent
                  ref={messagesContentRef}
                  className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4"
                >
                  {cardActionError ? (
                    <div className="rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-warm-soft)] px-3 py-2 text-xs text-[color:var(--vooki-warm)]">
                      {cardActionError}
                    </div>
                  ) : null}

                  {isLoading ? (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[color:var(--vooki-accent)]" />
                      <p className="text-xs font-medium text-[color:var(--vooki-app-text-muted)]">
                        Loading messages...
                      </p>
                    </div>
                  ) : selectedMessages.length === 0 ? (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 text-center">
                      <p className="text-sm font-medium text-[color:var(--vooki-app-text-strong)]">
                        No messages yet
                      </p>
                      <p className="text-xs text-[color:var(--vooki-app-text-muted)]">
                        Send a message to start the conversation.
                      </p>
                    </div>
                  ) : (
                    selectedMessages.map((message) => {
                      const isStructured =
                        message.messageType === "offer" || message.messageType === "counter_offer";
                      const collaborationHref = getCollaborationHref(
                        role,
                        message.offerData?.promotionId
                      );
                      const isIncoming = message.sender === "other";

                      const messageInviteId = message.offerData?.inviteId;
                      const messageInvite = messageInviteId
                        ? selectedConversation?.invites?.[messageInviteId]
                        : undefined;

                      const messageKey =
                        messageInviteId || message.offerData?.campaignId || "default";
                      const isLatestStructured =
                        message.id === latestStructuredMessageIdsByInvite[messageKey];

                      const isPending = messageInvite
                        ? messageInvite.status === "pending" ||
                          messageInvite.status === "counter_offered"
                        : selectedConversation?.status === "pending";

                      const showAcceptRejectActions =
                        isPending &&
                        isLatestStructured &&
                        (!messageInvite || !message.offerData?.promotionId) &&
                        ((role === "influencer" &&
                          isIncoming &&
                          (message.messageType === "offer" ||
                            message.messageType === "counter_offer")) ||
                          ((role === "brand" || role === "manager") &&
                            isIncoming &&
                            message.messageType === "counter_offer"));

                      const actions =
                        isStructured && isIncoming ? (
                          <>
                            {showAcceptRejectActions ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleStructuredAction(
                                      "accept_offer",
                                      selectedConversation,
                                      message
                                    )
                                  }
                                  disabled={cardActionKey !== null}
                                  className="rounded-full border border-[color:var(--vooki-accent-border)] bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
                                >
                                  {cardActionKey === `${message.id}:accept_offer` ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Accept offer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStructuredAction(
                                      "request_changes",
                                      selectedConversation,
                                      message
                                    )
                                  }
                                  disabled={cardActionKey !== null}
                                >
                                  {cardActionKey === `${message.id}:request_changes` ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Ask for revision
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[color:var(--vooki-warm)] hover:bg-[color:var(--vooki-warm-soft)] hover:text-[color:var(--vooki-warm)]"
                                  onClick={() =>
                                    handleStructuredAction("decline", selectedConversation, message)
                                  }
                                  disabled={cardActionKey !== null}
                                >
                                  Decline
                                </Button>
                              </>
                            ) : null}

                            {!showAcceptRejectActions && collaborationHref ? (
                              <Button size="sm" variant="outline" asChild>
                                <Link href={collaborationHref}>Open collaboration</Link>
                              </Button>
                            ) : null}
                          </>
                        ) : null;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                        >
                          {isStructured ? (
                            <StructuredOfferCard message={message} actions={actions} />
                          ) : (
                            <div
                              className={`max-w-[78%] rounded-[22px] px-4 py-2.5 ${
                                message.sender === "me"
                                  ? "bg-[color:var(--vooki-accent)] text-[color:var(--vooki-accent-text)]"
                                  : "border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)]"
                              }`}
                            >
                              <div className="space-y-1">
                                {(message.text || "").split("\n").map((line, index) => (
                                  <p
                                    key={`${message.id}-${index}`}
                                    className="text-sm leading-relaxed"
                                  >
                                    {line || " "}
                                  </p>
                                ))}
                              </div>
                              <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] opacity-80">
                                <span>{message.timestamp}</span>
                                {message.sender === "me" ? (
                                  message.read ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                ) : (
                                  <Circle className="h-1.5 w-1.5 fill-current stroke-none" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>

                <div className="border-t border-[color:var(--vooki-app-border-strong)] p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-[color:var(--vooki-app-text-muted)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-[color:var(--vooki-app-text-muted)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder={composerPlaceholder}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") sendMessage();
                      }}
                      className="h-11 rounded-full border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] placeholder:text-[color:var(--vooki-app-text-muted)]"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!draft.trim()}
                      className="h-11 w-11 rounded-full bg-[color:var(--vooki-accent)] p-0 text-[color:var(--vooki-accent-text)] shadow-[var(--vooki-shadow-accent)] hover:bg-[color:var(--vooki-accent-strong)]"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <h2 className="text-lg font-semibold text-[color:var(--vooki-app-text-strong)]">
                    Select a Conversation
                  </h2>
                  <p className="mt-1 text-sm text-[color:var(--vooki-app-text-soft)]">
                    Choose a thread to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <SearchPeopleDialog
        isOpen={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSelectUser={handleUserSelected}
        isLoading={creatingConversation}
      />

      {counterModal && (
        <CounterOfferModal
          open={counterModal.open}
          onOpenChange={(open) => setCounterModal(open ? counterModal : null)}
          inviteId={counterModal.inviteId}
          currentTerms={counterModal.terms}
          role={role === "manager" ? "brand" : role}
        />
      )}

      {declineModal && (
        <DeclineConfirmDialog
          open={declineModal.open}
          onOpenChange={(open) => setDeclineModal(open ? declineModal : null)}
          inviteId={declineModal.inviteId}
        />
      )}
    </div>
  );
}

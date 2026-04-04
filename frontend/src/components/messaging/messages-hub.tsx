/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import Link from "next/link"
import { useMemo, useState, useEffect, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchPeopleDialog } from "./search-people-dialog"
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Circle,
  Dot,
  Loader2,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
} from "lucide-react"

export type RoleVariant = "influencer" | "brand" | "manager"

interface HubOfferData {
  campaignId?: string
  promotionId?: string
  campaignTitle?: string
  deliverableSummary?: string
  paymentAmount?: number
  advanceAmount?: number
  draftDueAt?: string | Date | null
  postAt?: string | Date | null
  hashtags?: string[]
  discountCode?: string
  note?: string
}

export interface HubConversation {
  id: string
  name: string
  context: string
  avatar: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  status: "active" | "pending" | "closed"
  online: boolean
  threadType?: "direct" | "campaign" | "collaboration"
  campaignId?: string
  promotionId?: string
  campaignTitle?: string
}

export interface HubMessage {
  id: string
  sender: "me" | "other"
  text: string
  messageType?: "text" | "offer" | "counter_offer" | "system"
  offerData?: HubOfferData | null
  timestamp: string
  read: boolean
}

type StructuredMessageAction = "accept_offer" | "request_changes"

interface MessagesHubProps {
  role: RoleVariant
  heading: string
  subheading: string
  composerPlaceholder: string
  conversations: HubConversation[]
  messagesByConversation: Record<string, HubMessage[]>
  selectedConversationId?: string | null
  onSelectConversation?: (id: string) => void
  onSendMessage?: (text: string) => void
  onStructuredMessageAction?: (
    action: StructuredMessageAction,
    payload: { conversation: HubConversation; message: HubMessage }
  ) => Promise<void> | void
  onCreateConversation?: (userId: string) => Promise<void>
  isLoading?: boolean
  initialDraft?: string
}

const roleBadgeStyles: Record<RoleVariant, string> = {
  influencer: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300",
  brand: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  manager: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
}

const statusDotStyles: Record<HubConversation["status"], string> = {
  active: "text-emerald-500",
  pending: "text-amber-500",
  closed: "text-slate-400",
}

const formatMoney = (value?: number) => {
  if (!value) return "Not set"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const getCollaborationHref = (role: RoleVariant, promotionId?: string) => {
  if (!promotionId) return null
  if (role === "brand") return `/brand/promotions/${promotionId}`
  if (role === "influencer") return `/influencer/my-collabs/${promotionId}`
  return null
}

function StructuredOfferCard({
  message,
  actions,
}: {
  message: HubMessage
  actions?: ReactNode
}) {
  const isMine = message.sender === "me"
  const isCounter = message.messageType === "counter_offer"
  const offer = message.offerData || null
  const wrapperClass = isMine
    ? "border-cyan-200 bg-cyan-50 text-cyan-950 dark:border-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-100"
    : "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
  const badgeClass = isCounter
    ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"

  return (
    <div className={`max-w-[88%] rounded-2xl border p-4 shadow-sm ${wrapperClass}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`border-0 ${badgeClass}`}>
          {isCounter ? "Change request" : "Offer"}
        </Badge>
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
          <div className="rounded-xl border border-current/10 bg-white/50 px-3 py-2 dark:bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Deliverable</p>
            <p className="mt-1 font-medium">{offer?.deliverableSummary || "To be confirmed"}</p>
          </div>
          <div className="rounded-xl border border-current/10 bg-white/50 px-3 py-2 dark:bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Compensation</p>
            <p className="mt-1 font-medium">{formatMoney(offer?.paymentAmount)}</p>
          </div>
          <div className="rounded-xl border border-current/10 bg-white/50 px-3 py-2 dark:bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Advance</p>
            <p className="mt-1 font-medium">{offer?.advanceAmount ? formatMoney(offer.advanceAmount) : "No advance"}</p>
          </div>
          <div className="rounded-xl border border-current/10 bg-white/50 px-3 py-2 dark:bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Draft due</p>
            <p className="mt-1 font-medium">{formatDate(offer?.draftDueAt)}</p>
          </div>
          <div className="rounded-xl border border-current/10 bg-white/50 px-3 py-2 dark:bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Post by</p>
            <p className="mt-1 font-medium">{formatDate(offer?.postAt)}</p>
          </div>
          <div className="rounded-xl border border-current/10 bg-white/50 px-3 py-2 dark:bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-wide opacity-60">Discount code</p>
            <p className="mt-1 font-medium">{offer?.discountCode || "Not required"}</p>
          </div>
        </div>

        <div className="rounded-xl border border-current/10 bg-white/50 px-3 py-2 text-sm dark:bg-slate-900/40">
          <p className="text-[11px] uppercase tracking-wide opacity-60">Hashtags</p>
          <p className="mt-1 font-medium">
            {offer?.hashtags?.length ? offer.hashtags.join(", ") : "No required hashtags yet"}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] opacity-80">
        <span>{message.timestamp}</span>
        {isMine ? message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" /> : <Circle className="h-1.5 w-1.5 fill-current stroke-none" />}
      </div>
    </div>
  )
}

export function MessagesHub({
  role,
  heading,
  subheading,
  composerPlaceholder,
  conversations,
  messagesByConversation,
  selectedConversationId: providedSelectedId,
  onSelectConversation,
  onSendMessage,
  onStructuredMessageAction,
  onCreateConversation,
  initialDraft,
}: MessagesHubProps) {
  const [activeTab, setActiveTab] = useState<HubConversation["status"] | "all">("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(providedSelectedId || conversations[0]?.id || null)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [cardActionKey, setCardActionKey] = useState<string | null>(null)
  const [cardActionError, setCardActionError] = useState<string | null>(null)

  useEffect(() => {
    if (providedSelectedId !== undefined) {
      setSelectedId(providedSelectedId)
    }
  }, [providedSelectedId])

  useEffect(() => {
    if (!initialDraft) return
    setDraft((current) => current || initialDraft)
  }, [initialDraft])

  useEffect(() => {
    setCardActionError(null)
    setCardActionKey(null)
  }, [selectedId])

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesStatus = activeTab === "all" || conversation.status === activeTab
      const matchesQuery =
        conversation.name.toLowerCase().includes(query.toLowerCase()) ||
        conversation.context.toLowerCase().includes(query.toLowerCase())
      return matchesStatus && matchesQuery
    })
  }, [activeTab, conversations, query])

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) ?? null
  const selectedMessages = selectedId ? messagesByConversation[selectedId] ?? [] : []

  const openConversation = (id: string) => {
    setSelectedId(id)
    setMobileChatOpen(true)
    onSelectConversation?.(id)
  }

  const sendMessage = () => {
    if (!selectedId || !draft.trim()) return
    onSendMessage?.(draft.trim())
    setDraft("")
  }

  const handleUserSelected = async (user: any) => {
    try {
      setCreatingConversation(true)
      await onCreateConversation?.(user.id)
      setSearchDialogOpen(false)
    } catch (error) {
      console.error("Failed to create conversation:", error)
    } finally {
      setCreatingConversation(false)
    }
  }

  const handleStructuredAction = async (
    action: StructuredMessageAction,
    conversation: HubConversation,
    message: HubMessage
  ) => {
    if (!onStructuredMessageAction) return

    setCardActionError(null)
    setCardActionKey(`${message.id}:${action}`)
    try {
      await onStructuredMessageAction(action, { conversation, message })
    } catch (error) {
      setCardActionError(error instanceof Error ? error.message : "Unable to complete that action")
    } finally {
      setCardActionKey(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Badge className={`border-0 ${roleBadgeStyles[role]}`}>Messaging</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{heading}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subheading}</p>
          </div>
          <div className="flex items-center gap-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
              <TabsList className="grid h-auto grid-cols-4 border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              onClick={() => setSearchDialogOpen(true)}
              className="gap-2 bg-cyan-600 text-white hover:bg-cyan-700"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Message</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid h-[calc(100vh-17.5rem)] min-h-[560px] gap-4 lg:grid-cols-[360px_1fr]">
        <Card className={`${mobileChatOpen ? "hidden lg:flex" : "flex"} border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85`}>
          <div className="flex h-full w-full flex-col">
            <CardHeader className="border-b border-slate-200/70 pb-4 dark:border-slate-800/80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search conversations"
                  className="h-10 border-slate-300 bg-white pl-10 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 overflow-y-auto p-3">
              {filteredConversations.map((conversation) => {
                const isSelected = selectedId === conversation.id
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-500/10"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-semibold text-white">
                          {conversation.avatar}
                        </div>
                        {conversation.online ? (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{conversation.name}</p>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{conversation.lastMessageAt}</span>
                        </div>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{conversation.context}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="truncate text-xs text-slate-700 dark:text-slate-300">{conversation.lastMessage}</p>
                          <div className="ml-2 flex items-center gap-2">
                            <Dot className={`h-4 w-4 ${statusDotStyles[conversation.status]}`} />
                            {conversation.unreadCount > 0 ? (
                              <Badge className="border-0 bg-cyan-600 text-white hover:bg-cyan-600">{conversation.unreadCount}</Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </div>
        </Card>

        <Card className={`${mobileChatOpen ? "flex" : "hidden lg:flex"} border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85`}>
          <div className="flex h-full w-full flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b border-slate-200/70 pb-4 dark:border-slate-800/80">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
                        onClick={() => setMobileChatOpen(false)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-semibold text-white">
                          {selectedConversation.avatar}
                        </div>
                        {selectedConversation.online ? (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base text-slate-900 dark:text-slate-100">{selectedConversation.name}</CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedConversation.context}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 overflow-y-auto p-4">
                  {cardActionError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
                      {cardActionError}
                    </div>
                  ) : null}

                  {selectedMessages.map((message) => {
                    const isStructured = message.messageType === "offer" || message.messageType === "counter_offer"
                    const collaborationHref = getCollaborationHref(role, message.offerData?.promotionId)
                    const isIncoming = message.sender === "other"
                    const showInfluencerOfferActions = role === "influencer" && isIncoming && message.messageType === "offer"
                    const showBrandCounterActions = role === "brand" && isIncoming && message.messageType === "counter_offer"

                    const actions = isStructured && isIncoming ? (
                      <>
                        {showInfluencerOfferActions ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStructuredAction("accept_offer", selectedConversation, message)}
                              disabled={cardActionKey !== null}
                              className="bg-cyan-600 text-white hover:bg-cyan-700"
                            >
                              {cardActionKey === `${message.id}:accept_offer` ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Accept offer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStructuredAction("request_changes", selectedConversation, message)}
                              disabled={cardActionKey !== null}
                            >
                              {cardActionKey === `${message.id}:request_changes` ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Ask for revision
                            </Button>
                          </>
                        ) : null}

                        {showBrandCounterActions && collaborationHref ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={collaborationHref}>Review in collaboration</Link>
                          </Button>
                        ) : null}

                        {!showBrandCounterActions && collaborationHref ? (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={collaborationHref}>Open collaboration</Link>
                          </Button>
                        ) : null}
                      </>
                    ) : null

                    return (
                      <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                        {isStructured ? (
                          <StructuredOfferCard message={message} actions={actions} />
                        ) : (
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                              message.sender === "me"
                                ? "bg-cyan-600 text-white"
                                : "border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            }`}
                          >
                            <div className="space-y-1">
                              {(message.text || "").split("\n").map((line, index) => (
                                <p key={`${message.id}-${index}`} className="text-sm leading-relaxed">
                                  {line || " "}
                                </p>
                              ))}
                            </div>
                            <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] opacity-80">
                              <span>{message.timestamp}</span>
                              {message.sender === "me" ? (
                                message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                              ) : (
                                <Circle className="h-1.5 w-1.5 fill-current stroke-none" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>

                <div className="border-t border-slate-200/70 p-3 dark:border-slate-800/80 sm:p-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder={composerPlaceholder}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") sendMessage()
                      }}
                      className="h-10 border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!draft.trim()}
                      className="h-10 w-10 bg-cyan-600 p-0 text-white hover:bg-cyan-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Select a Conversation</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Choose a thread to start messaging.</p>
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
    </div>
  )
}

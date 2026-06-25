# Graph Report - collaber  (2026-06-22)

## Corpus Check
- 186 files · ~86,629 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1017 nodes · 2040 edges · 80 communities (72 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5443662`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 50 edges
2. `Button()` - 43 edges
3. `Card` - 35 edges
4. `CardContent` - 34 edges
5. `getRequestUser()` - 33 edges
6. `Badge()` - 26 edges
7. `getRequestUserId()` - 23 edges
8. `Input()` - 23 edges
9. `CardHeader` - 21 edges
10. `CardTitle` - 21 edges

## Surprising Connections (you probably didn't know these)
- `BrandDashboardContent()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/app/brand/dashboard/page.tsx → frontend/src/hooks/useAuth.ts
- `InfluencerDashboardContent()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/app/influencer/dashboard/page.tsx → frontend/src/hooks/useAuth.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/ui/dropdown-menu.tsx → frontend/src/lib/utils.ts
- `getCurrentUser()` --calls--> `getRequestUserId()`  [EXTRACTED]
  backend/src/controllers/auth/auth.controller.ts → backend/src/utils/requestUser.ts
- `getRequester()` --calls--> `getRequestUser()`  [EXTRACTED]
  backend/src/controllers/campaign.controller.ts → backend/src/utils/requestUser.ts

## Import Cycles
- None detected.

## Communities (80 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (23): clamp(), createPayment(), enrichPayments(), getBrandPayments(), getBrandPaymentsSummary(), getBrandRequesterId(), getMyBrandPayments(), getMyBrandPaymentsSummary() (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (50): completeSocialAuth(), getCurrentUser(), getOAuthSession(), getSocketToken(), requestOtp(), signIn(), signout(), signUpBasicInfo() (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (25): MessagesHubContent(), MessagesHubContentProps, StructuredMessageAction, HubConversation, HubMessage, MessagesHub(), MessagesHubProvider(), MessagesHubProviderProps (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (12): CollaborationType, CompensationSchema, CompensationType, CounterOfferSchema, DeliverableSchema, DiscoverInviteSchema, ICompensation, ICounterOffer (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (34): allowedStatuses, canAccessPromotion(), clamp(), createPromotion(), editableStatuses, formatPromotion(), getPromotionById(), getRequester() (+26 more)

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (5): forgotPasswordSchema, resetPasswordSchema, Card, Input(), Label()

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (34): buildInstagramUrl(), buildState(), buildYoutubeClient(), connectSocialAccount(), ensureInfluencer(), getSocialConnections(), handleInstagramCallback(), handleSocialCallback() (+26 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (17): InviteCardProps, BrandFormState, defaultSocialLinks, InfluencerFormState, SocialLinks, socialPlatforms, emptyForm, emptyForm (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (21): buildChatHref(), buildDeliverableSummary(), buildStructuredOfferData(), createDeliverableDraft(), Deliverable, DeliverableDraft, formatDateTime(), formatMoney() (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (21): inter, ProtectedRoute(), ProtectedRouteProps, ThemeProvider(), AuthContext, AuthContextType, AuthProvider(), AuthUser (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (59): AskQuestionDialog(), AskQuestionDialogProps, CounterOfferModal(), CounterOfferModalProps, CollaborationType, CompensationType, CreateInviteModalProps, Deliverable (+51 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (25): dependencies, axios, class-variance-authority, clsx, @hookform/resolvers, jsonwebtoken, jwt-decode, lucide-react (+17 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (24): dependencies, axios, bcryptjs, cloudinary, cookie-parser, cors, crypto, dotenv (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (19): Campaign, CampaignDetailPage(), CampaignInvite, CampaignPriority, CampaignResponse, CampaignStatus, campaignStatusTransitions, Deliverable (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (17): earningsData, engagementData, platformData, tooltipStyle, InviteCard(), campaignRows, InviteStatus, PaymentMethod (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.27
Nodes (14): clamp(), createEarning(), enrichEarnings(), getEarningById(), getEarningsByCampaign(), getEarningViewer(), getInfluencerEarnings(), getInfluencerEarningsSummary() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.23
Nodes (7): managedCreators, PaymentMethod, Priority, CardDescription, CardFooter, CardHeader, CardTitle

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (15): GenericSocialConnectionEntry, InfluencerProfile, INSTAGRAM_CARD_DEFINITION, InstagramConnectionEntry, isInstagramConnection(), isYoutubeConnection(), PlatformCardDefinition, PlatformKey (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (29): BrandLayout(), mobilePrimary, routeTitle, sidebarItems, isPathActive(), useRouteTitle(), InfluencerLayout(), mobilePrimary (+21 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (16): Campaign, CampaignListResponse, CampaignPriority, CampaignsPage(), CampaignStatus, formatMoney(), PaymentMethod, priorityPillClass (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (16): allowedPriority, allowedStatus, clamp(), createCampaign(), formatCampaign(), getCampaignById(), getRequester(), listCampaigns() (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (16): devDependencies, ts-node-dev, @types/bcryptjs, @types/cookie-parser, @types/cors, @types/express, @types/express-session, @types/ioredis (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (5): PaymentData, PaymentsParams, PaymentsService, ProcessPaymentsData, UpdatePaymentStatusData

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, eslint, eslint-config-next, @eslint/eslintrc, postcss, prettier, tailwindcss (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (13): authRouter, campaignRouter, collaborationRouter, discoverRouter, router, messagingRouter, router, profileRouter (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (7): priorityRank, Promotion, PromotionResponse, PromotionStatus, seedPromotions, statusMeta, tabs

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (4): EarningData, EarningsParams, EarningsService, UpdateEarningStatusData

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (8): CampaignListResponse, CampaignOption, Creator, DiscoverResponse, nicheFilters, seedCreators, SentInvite, SentInviteResponse

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (7): EarningRecord, EarningStatus, EarningSummary, PaymentMethod, paymentMethodLabels, statusColors, statusLabels

### Community 32 - "Community 32"
Cohesion: 0.35
Nodes (12): addToDiscoverShortlist(), buildPromotionSeedFromCampaign(), clamp(), ensureConversationForInvite(), findOrCreatePromotionForAcceptedInvite(), getDiscoverInfluencers(), getDiscoverInvites(), getDiscoverShortlist() (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (8): BrandInviteItem, BrandInviteListResponse, CampaignListResponse, CampaignOption, DiscoverProfilePage(), formatCompact(), previewProfiles, PublicProfile

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (11): formatDate(), formatMoney(), HubOfferData, MessagesHubProps, roleBadgeStyles, statusDotStyles, StructuredMessageAction, StructuredOfferCard() (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.13
Nodes (10): faqs, flowSteps, highlightCards, roleCards, roleLinks, roles, ResultConfig, ResultStatus (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (6): author, description, license, main, name, version

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (6): scripts, build, dev, format, nodemon, start

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (6): scripts, build, dev, format, lint, start

### Community 39 - "Community 39"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (4): devDependencies, prettier, scripts, install:all

### Community 41 - "Community 41"
Cohesion: 0.42
Nodes (9): acceptCounterOffer(), acceptInvite(), askQuestion(), brandCounterOffer(), counterInvite(), createCollaborationInvite(), declineInvite(), getReceivedInvites() (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (3): config, getUserRoleFromToken(), middleware()

### Community 55 - "Community 55"
Cohesion: 0.20
Nodes (9): Backend-specific guidance, Behavior, Examples of useful prompts, Formatting and tooling, Frontend-specific guidance, graphify, Important conventions, Notes for maintainers (+1 more)

### Community 77 - "Community 77"
Cohesion: 0.42
Nodes (8): archiveConversation(), getConversations(), getMessages(), getOrCreateConversation(), markMessagesAsRead(), searchMessaging(), authMiddleware(), getRequestUserId()

### Community 78 - "Community 78"
Cohesion: 0.22
Nodes (8): ConversationSchema, IConversation, IMessage, MessageSchema, buildConversationParticipants(), clearLegacyConversationContext(), reconcileDirectConversationsForUser(), reconcileDirectConversationThreads()

## Knowledge Gaps
- **392 isolated node(s):** `graphify`, `Behavior`, `Important conventions`, `Backend-specific guidance`, `Frontend-specific guidance` (+387 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 10` to `Community 35`, `Community 5`, `Community 7`, `Community 14`, `Community 16`, `Community 19`, `Community 20`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 35` to `Community 33`, `Community 34`, `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 19`, `Community 20`, `Community 27`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `getRequestUser()` connect `Community 32` to `Community 0`, `Community 4`, `Community 6`, `Community 41`, `Community 77`, `Community 15`, `Community 21`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `graphify`, `Behavior`, `Important conventions` to the rest of the system?**
  _392 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.054945054945054944 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0927536231884058 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.12051282051282051 - nodes in this community are weakly interconnected._
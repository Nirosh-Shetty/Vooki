# Graph Report - collaber  (2026-08-26)

## Corpus Check
- 209 files · ~176,056 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1138 nodes · 2345 edges · 85 communities (75 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0d9a78d`
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
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 50 edges
2. `Button()` - 48 edges
3. `Card` - 43 edges
4. `CardContent` - 42 edges
5. `getRequestUser()` - 36 edges
6. `Badge()` - 33 edges
7. `CardHeader` - 26 edges
8. `CardTitle` - 25 edges
9. `Input()` - 25 edges
10. `AI CONTEXT — STARTUP PROJECT` - 24 edges

## Surprising Connections (you probably didn't know these)
- `InfluencerDashboardContent()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/app/influencer/dashboard/page.tsx → frontend/src/hooks/useAuth.ts
- `DialogFooter()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/ui/dialog.tsx → frontend/src/lib/utils.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/ui/dropdown-menu.tsx → frontend/src/lib/utils.ts
- `requestOtp()` --calls--> `mailer()`  [EXTRACTED]
  backend/src/controllers/auth/auth.controller.ts → backend/src/utils/mailer/index.ts
- `completeSocialAuth()` --calls--> `uploadProfilePhotoToCloud()`  [EXTRACTED]
  backend/src/controllers/auth/auth.controller.ts → backend/src/utils/uploadProfilePhotoToCloud.ts

## Import Cycles
- None detected.

## Communities (85 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (19): clamp(), createEarning(), enrichEarnings(), getEarningById(), getEarningsByCampaign(), getEarningViewer(), getInfluencerEarnings(), getInfluencerEarningsSummary() (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.26
Nodes (13): completeSocialAuth(), getCurrentUser(), getOAuthSession(), getSocketToken(), requestOtp(), signIn(), signout(), signUpBasicInfo() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (25): MessagesHubContent(), MessagesHubContentProps, StructuredMessageAction, HubConversation, HubMessage, MessagesHub(), MessagesHubProvider(), MessagesHubProviderProps (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (12): CollaborationType, CompensationSchema, CompensationType, CounterOfferSchema, DeliverableSchema, DiscoverInviteSchema, ICompensation, ICounterOffer (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (31): allowedStatuses, canAccessPromotion(), clamp(), confirmPaymentReceived(), createPromotion(), editableStatuses, formatPromotion(), getPromotionById() (+23 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (14): flowSteps, messChips, PaymentMethod, Priority, roles, PLATFORM_CONFIG, PlatformKey, QuickLinksProps (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (39): buildInstagramUrl(), buildState(), buildYoutubeClient(), connectSocialAccount(), ensureInfluencer(), getConnectedAccounts(), getSocialConnections(), handleInstagramCallback() (+31 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (29): AboutCardProps, CollabHistory, CollaborationsCardProps, InviteCardProps, statusMap, EarningRecord, EarningStatus, EarningSummary (+21 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (21): buildChatHref(), buildDeliverableSummary(), buildStructuredOfferData(), createDeliverableDraft(), Deliverable, DeliverableDraft, formatDateTime(), formatMoney() (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (25): ProtectedRoute(), ProtectedRouteProps, activeCollaborations, ActivityEvent, audiencePulse, BrandDashboardContent(), Campaign, compact() (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (35): Campaign, CampaignListResponse, CampaignPriority, CampaignsPage(), CampaignStatus, formatMoney(), PaymentMethod, priorityPillClass (+27 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (27): dependencies, axios, browser-image-compression, class-variance-authority, clsx, @hookform/resolvers, jsonwebtoken, jwt-decode (+19 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (24): dependencies, axios, bcryptjs, cloudinary, cookie-parser, cors, crypto, dotenv (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (17): Campaign, CampaignDetailPage(), CampaignInvite, CampaignPriority, CampaignResponse, CampaignStatus, Deliverable, formatDate() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (14): earningsData, engagementData, platformData, summaryCards, tooltipStyle, topContent, CounterOfferModalProps, InviteCard() (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (17): CounterOfferModal(), DeclineConfirmDialog(), avatarPalette, ConversationAvatar(), formatDate(), formatMoney(), getAvatarInitial(), getAvatarStyle() (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (10): changePassword(), forgotPassword(), resetPassword(), setPasswordForOAuth(), mailer(), MailType, transporter, otpTemplate() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (29): AboutCard(), CollaborationsCard(), ConnectedAccounts(), ConnectedAccountsProps, FacebookConnectionEntry, formatMetric(), GenericSocialConnectionEntry, getPlatformTitle() (+21 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (37): inter, BrandLayout(), mobilePrimary, routeTitle, sidebarItems, ThemeProvider(), AuthContext, AuthContextType (+29 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (23): clamp(), createPayment(), enrichPayments(), getBrandPayments(), getBrandPaymentsSummary(), getBrandRequesterId(), getMyBrandPayments(), getMyBrandPaymentsSummary() (+15 more)

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
Cohesion: 0.07
Nodes (40): AskQuestionDialog(), AskQuestionDialogProps, DeclineConfirmDialogProps, ThemeToggle(), cn(), Alert, AlertDescription, AlertTitle (+32 more)

### Community 27 - "Community 27"
Cohesion: 0.26
Nodes (9): buildOAuthProvider(), handleSocialAuth(), resolveSocialDisplayName(), ROLE_OPTIONS, SocialAuthArgs, uploadAvatar(), redis, sessionStore (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (4): EarningData, EarningsParams, EarningsService, UpdateEarningStatusData

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (24): 10. Current Task / Work In Progress, 11. Bugs & Known Problems, 12. Important Conversation Decisions, 13. User Requirements, 14. Coding Conventions, 15. Environment & Commands, 16. Environment Variables, 17. External Services (+16 more)

### Community 31 - "Community 31"
Cohesion: 0.26
Nodes (7): Request, User, AuthenticatedRequestUser, UserRole, AccessTokenPayload, RefreshTokenPayload, PassportUser

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (8): mockNetwork, NetworkInfluencer, NetworkStatus, forgotPasswordSchema, resetPasswordSchema, Button(), Input(), Label()

### Community 33 - "Community 33"
Cohesion: 0.24
Nodes (5): AuthenticatedSocket, socketAuthMiddleware(), initializeSocket(), handleMessaging(), OfferMessageData

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (15): addToDiscoverShortlist(), buildPromotionSeedFromCampaign(), clamp(), createDiscoverInvites(), ensureConversationForInvite(), findOrCreatePromotionForAcceptedInvite(), getDiscoverInfluencers(), getDiscoverInvites() (+7 more)

### Community 35 - "Community 35"
Cohesion: 0.13
Nodes (15): updateInfluencerSettings(), authMiddleware(), authRouter, campaignRouter, discoverRouter, router, messagingRouter, router (+7 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (6): author, description, license, main, name, version

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (6): scripts, build, dev, format, nodemon, start

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, format, lint, start (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (4): devDependencies, prettier, scripts, install:all

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (6): priorityRank, Promotion, PromotionResponse, PromotionStatus, statusMeta, tabs

### Community 42 - "Community 42"
Cohesion: 0.28
Nodes (12): acceptCounterOffer(), acceptInvite(), askQuestion(), brandCounterOffer(), counterInvite(), createCollaborationInvite(), declineInvite(), getBrandInvites() (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (3): config, getUserRoleFromToken(), middleware()

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (9): CreateInviteModal(), BrandInviteItem, BrandInviteListResponse, CampaignListResponse, CampaignOption, DiscoverProfilePage(), formatCompact(), previewProfiles (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.20
Nodes (9): Backend-specific guidance, Behavior, Examples of useful prompts, Formatting and tooling, Frontend-specific guidance, graphify, Important conventions, Notes for maintainers (+1 more)

### Community 78 - "Community 78"
Cohesion: 0.18
Nodes (8): BrandProfileSchema, FeaturedContentSchema, InfluencerProfileSchema, LoginMetadataSchema, ManagerProfileSchema, OAuthProviderSchema, StatsConnectionSchema, UserSchema

### Community 79 - "Community 79"
Cohesion: 0.38
Nodes (9): applyLocaleSafeString(), clamp(), decodeImageInput(), getPublicInfluencerProfile(), profile(), sanitizeSocialLinks(), updateBrandProfile(), updateInfluencerProfile() (+1 more)

### Community 81 - "Community 81"
Cohesion: 0.36
Nodes (6): addFeaturedContent(), deleteFeaturedContent(), getFeaturedContent(), updateFeaturedContent(), influencerRouter, getUsernameAvailability()

### Community 82 - "Community 82"
Cohesion: 0.19
Nodes (15): archiveConversation(), getConversations(), getMessages(), getOrCreateConversation(), markMessagesAsRead(), searchMessaging(), ConversationSchema, IConversation (+7 more)

### Community 84 - "Community 84"
Cohesion: 0.22
Nodes (7): PaymentMethod, paymentMethodLabels, PaymentRecord, PaymentStatus, PaymentSummary, statusColors, statusLabels

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (3): 1. Multi-Currency Support (Localization), 2. Payouts and Wallets, Future Tasks / Backlog

## Knowledge Gaps
- **441 isolated node(s):** `INSTAGRAM_SCOPES`, `YOUTUBE_SCOPES`, `LoginMetadataSchema`, `OAuthProviderSchema`, `StatsConnectionSchema` (+436 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `Community 32` to `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 41`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 19`, `Community 84`, `Community 54`, `Community 26`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 26` to `Community 32`, `Community 5`, `Community 7`, `Community 10`, `Community 14`, `Community 19`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Card` connect `Community 5` to `Community 32`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 41`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 84`, `Community 54`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `INSTAGRAM_SCOPES`, `YOUTUBE_SCOPES`, `LoginMetadataSchema` to the rest of the system?**
  _441 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09830866807610994 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.0907563025210084 - nodes in this community are weakly interconnected._
- **Should `Community 6` be split into smaller, more focused modules?**
  _Cohesion score 0.09898989898989899 - nodes in this community are weakly interconnected._
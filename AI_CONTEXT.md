# AI CONTEXT — STARTUP PROJECT

## 1. Project Overview

* **What the startup/product does**: A premium platform (currently branded as "Vooki" or "Collaber") facilitating discovery, collaboration, campaign management, and financial payouts between brands and content creators (influencers).
* **Target users**: Brands (seeking creators for marketing) and Influencers (seeking brand deals).
* **Main problem being solved**: Streamlining the fragmented process of finding authenticated creators, managing campaign deliverables, messaging, and handling secure payments (escrow/direct).
* **Current product vision**: A high-end, premium dashboard utilizing modern web aesthetics (glassmorphism, vibrant gradients, micro-animations) to make campaign management feel effortless and visually stunning.
* **Important business/product assumptions**: The platform relies heavily on authentic social API metrics (YouTube, Instagram) rather than self-reported data to build trust between brands and creators.

## 2. Current Project State

* **What is currently implemented**: Brand dashboard structure, dynamic sidebar navigation, authenticated user session handling (JWT via cookies), Influencer discovery page with filters, Creator public profile views with platform-specific metrics, Campaign creation, real-time messaging via Sockets, basic structure of finance/payouts page.
* **What is partially implemented**: The UI redesign is currently mid-flight. We are in the process of replacing functional but standard Tailwind UI with the highly requested "premium Vooki" glassmorphic aesthetic.
* **What is not implemented**: Final deployment/hosting infrastructure.
* **What currently works**: Dynamic user data loading in the Topbar, separating social reach into specific platforms (IG/YT) on the Discover profiles.
* **What is currently broken**: The previous AI agent was attempting to replace a large chunk of the `payments/page.tsx` file and failed due to exact-string matching issues. The code itself runs, but the UI task is blocked.
* **Current development status**: Active UI overhaul and feature refinement based on user feedback.

## 3. Tech Stack

* **frontend**: Next.js (App Router), React 18+
* **backend**: Node.js, Express
* **database**: MongoDB (accessed via Mongoose)
* **authentication**: JWT stored in HTTP-only cookies, BcryptJS for passwords
* **APIs**: REST for internal backend communication; integrating with Meta/Google for social metrics.
* **hosting/deployment**: UNKNOWN/Not configured yet.
* **package manager**: npm
* **build tools**: Next.js built-in bundler
* **testing**: NEEDS VERIFICATION (no prominent test suite visible yet)
* **styling/UI framework**: Tailwind CSS, Radix UI primitives, Lucide React (icons), extensive use of custom CSS variables for themes (`--vooki-app-*`).
* **third-party services**: Cloudinary (image uploads), Mailtrap (email testing/delivery), Redis (for Socket.io sessions/caching).
* **environment/configuration requirements**: Requires running both frontend (`npm run dev` on port 3000) and backend (`npm run dev` on port 5000) simultaneously.

## 4. Repository Structure

* `d:\collaber\frontend\src\app`: Next.js App Router definitions (`/brand/`, `/influencer/`, `/manager/`).
* `d:\collaber\frontend\src\components`: Reusable UI components (shadcn/radix based), divided into feature folders (`collaboration`, `discover`, `messaging`, `workspace`).
* `d:\collaber\frontend\src\context`: Global React contexts (e.g., `auth-context.tsx`).
* `d:\collaber\backend\src\controllers`: Express route handlers containing business logic.
* `d:\collaber\backend\src\models`: Mongoose schemas and models (`Campaign`, `User`, `Promotion`, `Payment`).
* `d:\collaber\backend\src\socket`: Real-time socket event handlers.
* `d:\collaber\backend\src\utils`: Helper functions for tokens, mailing, Cloudinary.

## 5. Architecture

* **frontend → backend flow**: Next.js client components make API calls to the Express backend using standard `fetch` or `axios` with `credentials: "include"` to pass the JWT cookie.
* **API structure**: RESTful endpoints prefixed with `/api/` (e.g., `/api/payments/me`, `/api/auth/me`).
* **database flow**: Express controllers interact directly with Mongoose models to read/write from MongoDB.
* **authentication flow**: Client submits login -> Server hashes/verifies via Bcrypt -> Server generates JWT -> Server sets `Set-Cookie` header -> Client `auth-context.tsx` fetches `/api/auth/me` to hydrate the user state globally.
* **important services**: Redis is used for real-time socket message brokering and session management.
* **important state management**: Primarily React Context (`useAuth`) and local state (`useState`, `useMemo`).
* **external integrations**: Google APIs (YouTube), Meta (Instagram), Cloudinary.

## 6. Database

* **database technology**: MongoDB
* **tables/models**: `Users`, `Campaign`, `DiscoverInvite`, `Promotion`, `Payment`, `Message`, `Conversation`, `Earning`, `DiscoverShortlist`.
* **important fields**: Users have varying roles (`brand`, `influencer`, `manager`). `Payment` tracking involves `status` (`pending`, `processing`, `completed`, `failed`) and `paymentMethod` (`direct`, `escrow`).
* **relationships**: Mongoose `ObjectId` refs are used heavily (e.g., `Promotion` refs a `Campaign` and a `User`).
* **constraints**: Standard Mongoose validations; usernames must be unique (checked via `checkUsernameUnique.controller`).

## 7. Authentication & Authorization

* **how users authenticate**: Email/password exchange for JWT.
* **sessions/tokens**: JWT stored securely in an HTTP-only cookie to prevent XSS.
* **roles**: Defined at the User level (`brand`, `influencer`).
* **permissions**: Protected routes on the frontend (redirect non-brands away from `/brand/*`). Backend uses a `requireRole` middleware to enforce endpoint access.
* **important security assumptions**: The frontend UI alone does not secure data; all sensitive actions (payments, campaign creation) rely on backend JWT validation.

## 8. Important Product Decisions

* **Decision**: Split generic social followers into platform-specific reach (Instagram vs YouTube).
  * **Reason**: Brands need granular data to evaluate a creator properly, not just an aggregated number.
* **Decision**: Make Topbar user information dynamic.
  * **Reason**: The layout was hardcoded to "TechCorp". It now uses `AuthContext` to display the actual logged-in brand name and initials.

## 9. UI/UX Decisions

* **Design system**: The app uses a highly customized "Vooki" theme built on top of Tailwind. 
* **Visuals**: Glassmorphism (backdrop-blur), dark mode optimized surfaces, floating glowing orbs behind cards (`bg-[color:var(--vooki-app-glow-green)] blur-3xl`).
* **UX decisions**: Avoid plain colors (red, blue, green). Use micro-animations on hover (`hover:-translate-y-1 hover:shadow-md`). Inputs must feel premium (custom focus rings).
* **Alerts**: NO generic placeholders. Use the `generate_image` tool if placeholder assets are needed.

## 10. Current Task / Work In Progress

* **current objective**: Redesign the UI of the **Finance Page** (`/brand/payments/page.tsx`) and the **Invite Creator Modal** (`CreateInviteModal.tsx`).
* **what was already completed**: An implementation plan was proposed and approved by the user. The dynamic Topbar fix was deployed.
* **what remains**: Writing the actual React/Tailwind code to apply the Vooki theme to these two files.
* **files being modified**: `d:\collaber\frontend\src\app\brand\payments\page.tsx`, `d:\collaber\frontend\src\components\collaboration\CreateInviteModal.tsx`.
* **current implementation approach**: For the finance page, we want a glassmorphic hero dashboard with sleek transaction rows/cards featuring vibrant status badges and hover lifts. For the invite modal, break the long form into structured, card-like sections with premium controls.
* **known blockers**: The AI agent failed to apply the code edit to `payments/page.tsx` because `TargetContent` for the `replace_file_content` tool could not exactly match the large file block.
* **next steps**: Perform smaller, chunked edits using `multi_replace_file_content` or `replace_file_content` on `payments/page.tsx`, or overwrite the file entirely if it's safer.

## 11. Bugs & Known Problems

* **Symptom**: `replace_file_content` failed on `payments/page.tsx`.
  * **Suspected cause**: Trying to replace 200+ lines at once often results in whitespace/indentation mismatch errors in the tool.
  * **Next investigation**: Use multiple smaller `ReplacementChunks` or write the whole file from scratch using `write_to_file` if safe.
* **Symptom**: Network drop (`wsarecv`) between IDE and AI server.
  * **Cause**: Transient infrastructure timeout; resolved by restarting the session with this context file.

## 12. Important Conversation Decisions

* **Tool Usage Rules**:
  * NEVER use `cat` inside a bash command to create/append files.
  * ALWAYS use `grep_search` instead of bash `grep`.
  * DO NOT use `ls` for listing (use `list_dir`), `cat` for viewing (use `view_file`), `sed` for replacing.
* **Aesthetics**: The user is extremely strict about the UI feeling "premium" and "wowing" the user. A basic MVP-looking UI is considered a failure.

## 13. User Requirements

* **must-have**: Beautiful, premium, dynamic UI using glassmorphism and animations.
* **must-have**: Dynamic user data in the UI (no hardcoded "TechCorp").
* **should-have**: Add performance-based filtering to the 'My Network' page for past brand collaborations.
* **explicitly rejected**: Aggregated/generic metric cards. Do not lump YouTube and Instagram followers into one number.

## 14. Coding Conventions

* **component patterns**: Next.js `use client` directives used at the top of interactive components.
* **styling**: Tailwind classes, but heavily relying on CSS variables defined in `globals.css` (e.g., `text-[color:var(--vooki-app-text-strong)]`).
* **API patterns**: Standard `fetch` calls mapped to `useEffect` or button clicks, managing `isLoading` and `error` states locally.

## 15. Environment & Commands

* **running development (frontend)**: `cd frontend && npm run dev`
* **running development (backend)**: `cd backend && npm run dev`

## 16. Environment Variables

* **Backend Required Env Vars**:
  * `NODE_ENV`
  * `FRONTEND_URL`
  * `BACKEND_URL`
  * `MONGO_URI`
  * `REDIS_URL`
  * `PORT`
  * `JWT_SECRET`
  * `GOOGLE_CLIENT_ID`
  * `GOOGLE_CLIENT_SECRET`
  * `FACEBOOK_APP_ID`
  * `FACEBOOK_APP_SECRET`
  * `MAILTRAP_USERNAME`
  * `MAILTRAP_PASSWORD`
  * `CLOUDINARY_CLOUD_NAME`
  * `CLOUDINARY_API_KEY`
  * `CLOUDINARY_API_SECRET`

## 17. External Services

* **MongoDB**: Core database.
* **Redis**: Caching and socket session management.
* **Cloudinary**: Profile photo / asset hosting.
* **Mailtrap**: Email delivery for invites/password resets.
* **Google/Meta APIs**: Social metrics authentication and data fetching.

## 18. Deployment

* UNKNOWN. Currently optimizing local development.

## 19. Git / Branch State

* UNKNOWN. AI Agent has not checked git status. Do not overwrite existing work indiscriminately.

## 20. What NOT To Change

* **Auth Flow**: Do not touch the `AuthContext` or backend JWT middleware unless explicitly requested; it currently works perfectly.
* **Database Models**: Unless a new feature requires it, leave the Mongoose schemas intact.
* **CSS Variables**: Do not delete the Vooki variables in `globals.css`; they are the backbone of the UI system.

## 21. Completed Tasks

1. Redesigned Finance Page (`payments/page.tsx`) with Vooki aesthetic (glassmorphism, vibrant badges, hover lifts). Addressed transaction map updates.
2. Redesigned Invite Modal (`CreateInviteModal.tsx`) into structured cards with premium controls. Handled user feedback to normalize padding (`p-4`, `rounded-xl`) to maintain standard sizing and dynamic deliverable formats based on platform.
3. Updated topbar user info across Brand, Creator (Influencer), and Manager layouts (`WorkspaceShell`) to dynamically pull name, email/handle, profile photo (if available), or fall back to full name initials from `AuthContext`.
4. **Localization (Paused)**: Created a `useCurrency` hook for Phase 1 multi-currency display (INR for creators, USD for brands). The user decided to undo this and pause currency work for later.

## 22. Next Steps

1. Move on to the Brand Dashboard redesign or whichever UI/UX component the user prioritizes next.
2. Read this `AI_CONTEXT.md` file completely before beginning new work.

## 23. Instructions for the Next AI Agent

* **READ THIS FILE FIRST** before taking any action.
* Inspect the repository before making changes.
* Preserve existing architecture (Next.js client/server component separation, AuthContext).
* Avoid rewriting working backend systems unnecessarily.
* You are currently in the middle of a UI redesign flow. Do not lose momentum.
* **Use precision** when calling `multi_replace_file_content`. Ensure `StartLine` and `EndLine` are accurate to avoid tool failures.
* Remember the strict tool rules: no `cat` for writing, no `grep` in bash.
* Keep your changes focused entirely on the frontend UI aesthetic upgrades requested in the task list, while maintaining standard paddings and sizing.

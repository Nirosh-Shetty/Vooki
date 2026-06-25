## graphify

For any question about this repo's architecture, structure, components, or how to add/modify/find
code, your first action should be `graphify query "<question>"` when `graphify-out/graph.json`
exists. Use `graphify path "<A>" "<B>"` for relationship questions and `graphify explain "<concept>"`
for focused-concept questions. These return a scoped subgraph, usually much smaller than the full
report or raw grep output.

Triggers: "how do I…", "where is…", "what does … do", "add/modify a <component>",
"explain the architecture", or anything that depends on how files or classes relate.

If `graphify-out/wiki/index.md` exists, use it for broad navigation. Read `graphify-out/GRAPH_REPORT.md`
only for broad architecture review or when query/path/explain do not surface enough context. Only read
source files when (a) modifying/debugging specific code, (b) the graph lacks the needed detail, or
(c) the graph is missing or stale.

Type `/graphify` in Copilot Chat to build or update the graph.

---

# Repository Instructions for Copilot

Use these guidelines for all code changes in this repository unless a more specific folder-level
instruction file exists.

## Behavior
- Prefer clean, production-grade solutions over quick prototypes.
- When unsure, ask for clarification rather than guessing.
- Keep changes small and focused; avoid large refactors unless explicitly requested.
- Reuse existing project patterns and helper utilities whenever possible.
- Use lesser token, more efficient solutions when they are clear and maintainable.
- Avoid introducing new dependencies unless they are widely used, well-maintained, and necessary.

## Important conventions
- Use TypeScript with explicit types/interfaces for public APIs, props, route handlers, and model
  shapes.
- Use `async/await` consistently; avoid callback style and mixed promise handling.
- Validate external input and sanitize before use.
- Avoid hardcoded secrets, credentials, or environment-specific values in source code.
- Do not leave stray `console.log`, `debugger`, or dead code in committed files.

## Backend-specific guidance
- Use existing Express middleware patterns for auth, error handling, and request validation.
- Return API responses using typed response shapes rather than raw objects wherever possible.
- Centralize error responses and use HTTP status codes consistently.

## Frontend-specific guidance
- Use Next.js conventions in `src/app`, `src/components`, and page routes.
- Favor composable, reusable components and keep UI logic separated from data-fetching concerns.
- Ensure UI state is predictable and accessible.

## Formatting and tooling
- Follow repository linting and formatting rules from `eslint.config.mjs`, `prettier.config.js`, and
  `tsconfig.json`.
- Prefer existing code style over inventing new style rules.
- Add helpful comments only when logic is non-obvious.

## Examples of useful prompts
- "Refactor `backend/controllers/profile.controller.ts` to replace any `any` types with explicit
  interfaces and add centralized error handling." 
- "Create a typed API response model and update `backend/routes/profile.route.ts` to use it." 
- "Add input validation for this route and ensure the frontend form handles backend errors cleanly."

## Notes for maintainers
- Keep this file concise and actionable.
- Use folder-specific `.github/copilot-instructions.md` files only when a subset of rules should
  differ from the repo-wide defaults.

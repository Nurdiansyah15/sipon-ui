# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on 0.0.0.0:3000 (all interfaces)
npm run build      # Production build
npm run generate   # Static site generation
npm run preview    # Preview production build
```

No lint or test commands are configured yet — check package.json before assuming otherwise.

## Environment Variables

Copy `.env.example` to `.env` and set:

```
NUXT_PUBLIC_API_BASE=http://localhost:8888   # sipon-api base URL
```

## Architecture overview

This is the **Sipon** admin/backoffice frontend — a **Nuxt 4** app (`future.compatibilityVersion: 4`), consuming
the **sipon-api** Go backend (`../sipon-api`). All application code lives under `app/`, this is the key structural
difference from Nuxt 3.

This project mirrors the architecture and conventions of `k-forum-backoffice` (a sibling project). When in doubt
about a pattern not covered below, check how that repo solved the same problem before inventing a new one.

### Directory layout

```
app/              # All client-side app code (Nuxt 4 convention)
  components/     # Auto-imported Vue components (PascalCase), prefixed App* for global chrome
  composables/     # Auto-imported composables (camelCase, use* prefix)
  layouts/        # default.vue (dashboard sidebar), auth.vue (centered card)
  middleware/     # auth.global.ts — client-side auth guard (runs on every route)
  pages/          # File-based routing (kebab-case .vue files)
  plugins/        # auth.client.ts — hydrates the auth store, installs the 401 interceptor
  stores/         # Pinia stores (camelCase, no suffix for the core `auth` store)
  utils/          # Auto-imported utilities (errorParser.ts)
  assets/css/     # main.css — Tailwind v4 + @nuxt/ui imports
shared/           # Types importable from anywhere via the `#shared` alias
  types/          # ApiResponse.ts, User.ts, Auth.ts, Session.ts — the ONE canonical location for API types
```

There is no `server/` Nitro layer — the frontend calls `sipon-api` directly from the browser via `useApi()`. Do
not add a Nitro BFF/proxy layer unless there's a concrete reason (e.g. hiding a secret) — it adds an indirection
this project deliberately avoids.

### Tech stack

- **UI**: `@nuxt/ui` v4 — use `U`-prefixed components (`UButton`, `UForm`, `UDashboardGroup`, etc.). Primary color:
  `blue`, neutral: `slate` (see [app/app.config.ts](app/app.config.ts) — change here, not per-component, if the
  brand palette changes).
- **State**: Pinia (`@pinia/nuxt`)
- **Icons**: Lucide only (`i-lucide-*`), bundled locally via `@iconify-json/lucide`
- **Validation**: `zod`, always paired with `<UForm :schema :state @submit>` — see "Forms" below
- **Utilities**: `@vueuse/core`, `@vueuse/nuxt`

Deliberately NOT used (don't reach for these without discussing first): i18n module (single-language for now),
VeeValidate (Zod + UForm covers it), a Nitro BFF, ESLint/Prettier (not configured yet).

### API integration

All backend calls go through the `useApi()` composable ([app/composables/useApi.ts](app/composables/useApi.ts)),
which:
- Prepends `NUXT_PUBLIC_API_BASE` to every request
- Injects `Authorization: Bearer <token>` from `useAuthStore`
- Provides `.get()`, `.post()`, `.put()`, `.patch()`, `.delete()` helpers

sipon-api uses **two different path prefixes** for auth — don't assume one single prefix:
- `/api/v1/web/auth/*` — register, login, refresh-token, me, password/otp management
- `/api/v1/auth/*` (no `/web`) — session bootstrap and logout only

Example: `api.post('/api/v1/web/auth/login', payload)`, `api.get('/api/v1/auth/session')`.

### Response envelope

Every sipon-api response follows the same envelope (see [shared/types/ApiResponse.ts](shared/types/ApiResponse.ts)):

```jsonc
// success
{ "status": "success", "status_code": 200, "message": "...", "data": { ... }, "meta": null }
// error
{ "status": "error", "status_code": 422, "error_code": "ERR_UNPROCESSABLE_ENTITY", "errors": { "email": "required" } }
```

`errors` is either a plain string or a `Record<string, string>` (validation errors, keyed by field name). Always
route caught errors through `parseApiError(err, fallbackMessage)` from
[app/utils/errorParser.ts](app/utils/errorParser.ts) before showing them in a toast — don't hand-parse `err.data`
in a component.

422 validation responses can be shown per-field if needed later, but for now the login/register pages just show
the parsed message in a single toast — keep it that way unless a real UX need for inline field errors comes up.

### Authentication

- **Store**: `useAuthStore` ([app/stores/auth.ts](app/stores/auth.ts)) — persists `user`, `token`, `refreshToken`,
  `roles`, `permissions` to `localStorage` under key `sipon_auth`. Access tokens are **never** stored in cookies —
  sipon-api returns them in the response body only.
- **Hydration**: The global middleware and the `auth.client` plugin both call `authStore.hydrate()` on first load
  to restore state from localStorage (client-side only, guarded by `if (!authStore.isHydrated)`).
- **Global middleware** ([app/middleware/auth.global.ts](app/middleware/auth.global.ts)) is **client-only**
  (`if (import.meta.server) return`) — there is no SSR-side auth gate, matching the reference project's tradeoff.
  A hard refresh briefly renders unauthenticated before client hydration kicks in; this is intentional, not a bug.
  Public routes: `/auth/login`, `/auth/register`. Root `/` redirects to `/dashboard` or `/auth/login` based on
  `isLoggedIn`.
- **Session bootstrap**: `/auth/me` only returns the user profile — it has **no roles/permissions**. Always call
  `authStore.fetchSession()` (hits `GET /api/v1/auth/session`) after login/register to get `roles` and
  `permissions` for RBAC-driven UI. `login()` and `register()` already do this internally — don't call it again
  redundantly on every page.
- **401 handling**: [app/plugins/auth.client.ts](app/plugins/auth.client.ts) wraps `globalThis.$fetch` with an
  `onResponseError` hook that clears the session and redirects to `/auth/login` on a 401, guarded by a
  `sessionExpiredHandled` flag so simultaneous parallel requests don't fire the redirect/toast more than once.
- **Refresh token**: not yet wired into an automatic retry-on-401 flow. `authStore` has the token pair; if you add
  silent refresh, do it in the same plugin, not scattered across pages.

### RBAC — not yet implemented (next milestone)

The auth store already carries `roles: SessionRole[]` and `permissions: SessionPermission[]` from the session
bootstrap, and exposes `hasRole(name)` / `hasPermission(key)` getters — this is intentional groundwork so the next
milestone (role/permission management UI, route/component gating) has something to build on without touching the
store shape again.

sipon-api's RBAC model (see its own CLAUDE.md / docs for full detail): system roles (`usergod`, `superadmin`,
`admin`, `member`) with a fixed permission set defined in Go constants, plus custom roles whose permissions are
DB-backed and manageable via `/api/v1/web/role-permission/*` (superadmin/usergod only). Only 3 permission keys
exist today (`manage_system_settings`, `assign_role`, `manage_users`) — treat
`GET /api/v1/web/role-permission/permission-keys` as the source of truth rather than hardcoding a list when that
UI gets built.

When building RBAC UI, follow the reference project's pattern rather than inventing a new one:
- A `usePermission()`/`useAcl()` composable exposing `can(key)` / `hasRole(role)`, built on top of the auth
  store's `hasRole`/`hasPermission` getters.
- A `<PermissionGate>` component for declarative template-level gating (`action`/`roles` props + `#fallback` slot).
- Named middleware (`role.ts`, `permission.ts`) for route-level gating, opted into per-page via
  `definePageMeta({ middleware: ['role'] })` — don't bake permission checks into the global middleware.
- Nav items in `app/layouts/default.vue` gated by an `allow({ roles, perms })` helper, not scattered `v-if`s.

### Forms

Standardize on Zod + `UForm`, as in [app/pages/auth/login.vue](app/pages/auth/login.vue) and
[app/pages/auth/register.vue](app/pages/auth/register.vue):

```vue
const schema = z.object({ ... })
type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({ ... })

async function onSubmit(event: FormSubmitEvent<Schema>) { ... }
```

```vue
<UForm :schema="schema" :state="state" @submit="onSubmit">
  <UFormField label="..." name="...">
    <UInput v-model="state.field" class="w-full" />
  </UFormField>
</UForm>
```

Don't fall back to manual `ref()` + hand-written `if` validation, even for "simple" forms — the reference project
did this inconsistently and it's explicitly something this project should NOT repeat.

### Naming conventions

| Location | Convention | Example |
|----------|------------|---------|
| `app/pages/` | kebab-case, nested folders for feature routes | `auth/login.vue` |
| `app/components/` | PascalCase | `AppUserMenu.vue` |
| `app/composables/` | camelCase + `use` prefix | `useApi.ts` |
| `app/stores/` | camelCase | `auth.ts` |
| `app/middleware/` | kebab-case; `.global.ts` suffix for global | `auth.global.ts` |
| `shared/types/` | PascalCase | `ApiResponse.ts` |

### Auto-imports

Nuxt 4 auto-imports everything from `app/composables/`, `app/components/`, `app/utils/`, and all Vue Composition
API (`ref`, `computed`, `reactive`, etc.) — no import statements needed for these inside `.vue` files.

For Pinia stores and shared types, import explicitly:
```ts
import { useAuthStore } from '~/stores/auth'
import type { UserMe } from '#shared/types/User'
```

### Package manager

npm only — don't introduce a second lockfile (bun/pnpm/yarn). Commit `package-lock.json`.

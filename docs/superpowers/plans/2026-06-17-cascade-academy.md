# Cascade Academy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Cascade Academy CSS learning platform (5 screens) in Nuxt 4 + Tailwind v4, backed by Directus collections, matching `design_handoff_cascade_academy/` 1:1.

**Architecture:** Nuxt 4 pages render the UI; all Directus access goes through Nitro server routes that hold the admin token. Auth is a custom username/email+password check against `cascade_users` with a signed httpOnly cookie. Pure logic (checker color normalization, assertion eval, auth verify) is unit-tested with Vitest; visual screens are verified in the browser against the screenshots.

**Tech Stack:** Nuxt 4, Tailwind v4, CodeMirror 6, Directus (REST via server `$fetch`), Vitest, Google Fonts (Bricolage Grotesque / Plus Jakarta Sans / JetBrains Mono).

**Environment note:** Directus is only reachable from PowerShell (`Invoke-RestMethod`) in this dev sandbox — Bash `curl` returns 000. Use PowerShell for schema creation + seeding + manual API probes. The running Nuxt server reaches Directus normally at runtime.

---

## File Structure

```
.env                                  # already has DIRECTUS_URL, DIRECTUS_TOKEN; add NUXT_SESSION_SECRET
nuxt.config.ts                        # runtimeConfig (directus token/url, session secret), fonts head
app/assets/css/main.css               # @theme design tokens + base styles
app/app.vue                           # <NuxtLayout><NuxtPage/></NuxtLayout>
app/layouts/default.vue               # AppNav + page slot
app/layouts/blank.vue                 # login (no nav)
app/components/BrandLogo.vue
app/components/AppNav.vue
app/components/LightCircles.vue
app/components/ProgressBar.vue
app/components/CourseCard.vue
app/components/LessonRow.vue
app/components/StatTile.vue
app/components/ChatPanel.vue
app/components/lesson/CodeEditor.vue   # CodeMirror 6 wrapper
app/components/lesson/LivePreview.vue
app/components/lesson/CheckPanel.vue
app/pages/login.vue
app/pages/kurse/index.vue
app/pages/kurse/[slug].vue
app/pages/lektion/[id].vue
app/pages/profil.vue
app/composables/useAuth.ts
app/composables/useGuestProgress.ts
app/utils/checker.ts                  # color normalize + assertion eval (pure, tested)
app/utils/chatMock.ts                 # static chat data
server/utils/directus.ts              # server-side Directus fetch helper (token)
server/utils/session.ts               # sign/verify cookie (pure, tested)
server/api/auth/login.post.ts
server/api/auth/logout.post.ts
server/api/me.get.ts
server/api/courses/index.get.ts
server/api/courses/[slug].get.ts
server/api/lessons/[id].get.ts
server/api/progress.post.ts
scripts/directus-schema.ps1           # create cascade_* collections + fields + relations
scripts/directus-seed.ps1             # seed users, course, chapters, 15 lessons, sample progress
scripts/lessons.json                  # the 15 lessons content (source for seed)
test/checker.test.ts
test/session.test.ts
vitest.config.ts
```

---

## Phase 0 — Project setup

### Task 0.1: Install dependencies

**Files:** Modify `package.json`

- [ ] **Step 1: Install runtime + dev deps**

Run:
```
yarn add codemirror @codemirror/lang-css @codemirror/state @codemirror/view @codemirror/theme-one-dark
yarn add -D vitest @vue/test-utils happy-dom
```
Expected: packages added, `yarn.lock` updated.

- [ ] **Step 2: Add test script**

In `package.json` `scripts`, add: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'happy-dom', include: ['test/**/*.test.ts'] },
})
```

- [ ] **Step 4: Verify**

Run: `yarn test` → Expected: "No test files found" (exit 0-ish) or runs 0 tests. Acceptable before tests exist.

### Task 0.2: Runtime config + session secret

**Files:** Modify `.env`, `nuxt.config.ts`

- [ ] **Step 1: Add session secret to `.env`**

Append: `NUXT_SESSION_SECRET=dev-only-change-me-7f3a91`

- [ ] **Step 2: Wire runtimeConfig + fonts in `nuxt.config.ts`**

```ts
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  css: ['./app/assets/css/main.css'],
  runtimeConfig: {
    directusUrl: process.env.DIRECTUS_URL,
    directusToken: process.env.DIRECTUS_TOKEN,
    sessionSecret: process.env.NUXT_SESSION_SECRET,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      title: 'Cascade Academy',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap' },
      ],
    },
  },
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Verify** Run `yarn dev`, open http://localhost:3000 — server boots without config errors. Stop server.

### Task 0.3: Design tokens (main.css)

**Files:** Modify `app/assets/css/main.css`

- [ ] **Step 1: Write tokens + base** (full token set from spec §8 / handoff README)

```css
@import "tailwindcss";

@theme {
  --color-teal-600: #12B5A5;
  --color-teal-700: #0E7A70;
  --color-teal-500: #3AC9B0;
  --color-teal-soft: #DFF6F3;
  --color-teal-soft-border: #CDEDE8;
  --color-success: #2BB673;
  --color-success-soft: #E5F6ED;
  --color-bg: #F3FAF8;
  --color-surface: #FFFFFF;
  --color-surface-alt: #FBFDFC;
  --color-border: #DCEBE7;
  --color-border-2: #E8F0EE;
  --color-text: #1F2A28;
  --color-text-muted: #6E807C;
  --color-text-faint: #8A9794;

  --font-display: "Bricolage Grotesque", sans-serif;
  --font-sans: "Plus Jakarta Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --radius-pill: 999px;
  --shadow-card: 0 10px 24px -18px rgba(31,42,40,0.22);
  --shadow-elevated: 0 18px 50px -22px rgba(31,42,40,0.22);
  --shadow-btn: 0 8px 18px -8px rgba(18,181,165,0.9);
}

:root { font-family: var(--font-sans); color: var(--color-text); }
body { background: var(--color-bg); margin: 0; }
h1,h2,h3 { font-family: var(--font-display); letter-spacing: -0.3px; }
```

- [ ] **Step 2: Verify** Restart `yarn dev`; background is light teal `#F3FAF8`, fonts load (check Network tab for Google Fonts 200).

### Task 0.4: app.vue + layouts

**Files:** Modify `app/app.vue`; Create `app/layouts/default.vue`, `app/layouts/blank.vue`

- [ ] **Step 1: `app/app.vue`**

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 2: `app/layouts/blank.vue`**

```vue
<template><slot /></template>
```

- [ ] **Step 3: `app/layouts/default.vue`** (nav added in Task 3)

```vue
<template>
  <div class="min-h-screen">
    <AppNav />
    <main class="mx-auto max-w-[1180px] px-7 py-7"><slot /></main>
  </div>
</template>
```

- [ ] **Step 4: Verify** Add a temporary `app/pages/index.vue` with `<template><div>ok</div></template>`; visit `/` → renders "ok" inside layout. (Will be replaced; see Task 8 redirect.)

---

## Phase 1 — Directus schema + seed (PowerShell)

### Task 1.1: Lesson content data

**Files:** Create `scripts/lessons.json`

- [ ] **Step 1: Author the 15 lessons** as a JSON array. Each item:
`{ chapter, sort, title, type, task, html, css_starter, assertions, hint, solution }`.
Follow this concrete pattern (2 worked examples; produce all 15 in the same shape):

```json
[
  {
    "chapter": "Selektoren & Grundlagen", "sort": 1,
    "title": "Was ist ein Selektor?", "type": "lesen",
    "task": "Lies dir an, wie Selektoren funktionieren.",
    "html": "<h1>Hallo CSS</h1>", "css_starter": "", "assertions": [],
    "hint": "", "solution": ""
  },
  {
    "chapter": "Text & Schrift", "sort": 5,
    "title": "Farbe & Textausrichtung", "type": "uebung",
    "task": "Gib der Überschrift die Farbe `teal` und zentriere den Text mit `text-align`.",
    "html": "<h1>Willkommen</h1>\n<p>Ein Beispieltext.</p>",
    "css_starter": "h1 {\n  \n}",
    "assertions": [
      { "selector": "h1", "prop": "color", "expected": "teal" },
      { "selector": "h1", "prop": "text-align", "expected": "center" }
    ],
    "hint": "color: teal; und text-align: center; gehören in den h1-Block.",
    "solution": "h1 {\n  color: teal;\n  text-align: center;\n}"
  }
]
```

Remaining 13 lessons (titles + properties per spec §4): L2 `p {color:blue}`; L3 `.box {background-color:...}`; L4 `color`+`background-color`; L6 `font-size`+`font-weight`; L7 `font-family`+`line-height`; L8 `text-transform:uppercase`+`text-decoration`; L9 `padding`; L10 `margin`; L11 `border`; L12 `border-radius`+`box-shadow`; L13 `background`/`background-color`; L14 `width`+`display`; L15 combo (`padding`,`border-radius`,`box-shadow`,`background`). Each `uebung` needs valid `html`, `css_starter`, `assertions`, `hint`, `solution`.

- [ ] **Step 2: Validate JSON** Run (PowerShell): `Get-Content scripts/lessons.json -Raw | ConvertFrom-Json | Measure-Object` → Count reflects 15 items.

### Task 1.2: Schema creation script

**Files:** Create `scripts/directus-schema.ps1`

- [ ] **Step 1: Write idempotent schema script** that reads `.env`, sets `$headers`, and POSTs collections + fields + relations to `$url/collections`, `$url/fields/{collection}`, `$url/relations`. Collections per spec §2 (`cascade_users`, `cascade_courses`, `cascade_chapters`, `cascade_lessons`, `cascade_progress`). Wrap each create in try/catch so re-runs skip existing (409). Helper:

```powershell
$envLines = Get-Content .env
$url = ($envLines | Select-String '^DIRECTUS_URL=').ToString().Split('=',2)[1].Trim()
$token = ($envLines | Select-String '^DIRECTUS_TOKEN=').ToString().Split('=',2)[1].Trim()
$h = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
function New-Col($name, $fields) {
  $body = @{ collection = $name; schema = @{}; meta = @{ icon='school' }; fields = $fields } | ConvertTo-Json -Depth 8
  try { Invoke-RestMethod -Method Post -Uri "$url/collections" -Headers $h -Body $body | Out-Null; Write-Host "created $name" }
  catch { Write-Host "skip $name ($($_.Exception.Message))" }
}
```
Define each collection's primary field (`id` uuid for users, auto-int PK acceptable for others) and remaining fields with correct `type`/`meta.interface`. Add relations (`cascade_chapters.course`, `cascade_lessons.chapter`/`.course`, `cascade_progress.user`/`.lesson`/`.course`) via `POST $url/relations`.

- [ ] **Step 2: Run** `powershell -File scripts/directus-schema.ps1` → prints created/skip per collection, no unhandled errors.

- [ ] **Step 3: Verify** PowerShell: `Invoke-RestMethod "$url/collections" -Headers $h` then filter `cascade_*` → all 5 present. Check `Invoke-RestMethod "$url/fields/cascade_lessons" -Headers $h` lists `assertions` (json), `html`, etc.

### Task 1.3: Seed script

**Files:** Create `scripts/directus-seed.ps1`

- [ ] **Step 1: Write seed script** — idempotent (delete-then-insert `cascade_*` rows, or check-by-slug/username). Inserts:
  - 2 users (testuser-1 „Mara K." MK, testuser-2 „Tom B." TB, password `test1234`, `started_at` = (Get-Date).AddDays(-12), streak 5/0).
  - 3 courses (css-grundlagen active; flexbox-layout + animationen locked with unlock_hint).
  - 4 chapters under css-grundlagen (Selektoren & Grundlagen, Text & Schrift, Box-Modell, Hintergrund & Abschluss) capturing returned ids.
  - 15 lessons from `scripts/lessons.json`, mapping each `chapter` name → chapter id + course id.
  - Sample progress: mark lessons sort 1–5 done for testuser-1 (so course shows ~33%).

```powershell
# pattern for inserting and capturing id
$r = Invoke-RestMethod -Method Post -Uri "$url/items/cascade_courses" -Headers $h -Body ($course | ConvertTo-Json -Depth 6)
$courseId = $r.data.id
```

- [ ] **Step 2: Run** `powershell -File scripts/directus-seed.ps1` → prints inserted counts.

- [ ] **Step 3: Verify** PowerShell: `Invoke-RestMethod "$url/items/cascade_lessons?limit=-1" -Headers $h).data.Count` → 15. `(Invoke-RestMethod "$url/items/cascade_users" -Headers $h).data` → 2 users.

---

## Phase 2 — Server layer (TDD where logic exists)

### Task 2.1: Session util (signed cookie) — TDD

**Files:** Create `server/utils/session.ts`, `test/session.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from '../server/utils/session'

describe('session', () => {
  const secret = 'test-secret'
  it('round-trips a user id', () => {
    const token = signSession('user-123', secret)
    expect(verifySession(token, secret)).toBe('user-123')
  })
  it('rejects tampered token', () => {
    const token = signSession('user-123', secret)
    expect(verifySession(token + 'x', secret)).toBeNull()
  })
  it('rejects wrong secret', () => {
    const token = signSession('user-123', secret)
    expect(verifySession(token, 'other')).toBeNull()
  })
})
```

- [ ] **Step 2: Run** `yarn test test/session.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
import { createHmac } from 'node:crypto'
function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}
export function signSession(userId: string, secret: string) {
  return `${userId}.${sign(userId, secret)}`
}
export function verifySession(token: string | undefined, secret: string): string | null {
  if (!token) return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const userId = token.slice(0, i), sig = token.slice(i + 1)
  const expected = sign(userId, secret)
  if (sig.length !== expected.length) return null
  return sig === expected ? userId : null
}
```

- [ ] **Step 4: Run** `yarn test test/session.test.ts` → PASS (3 tests).

### Task 2.2: Directus server helper

**Files:** Create `server/utils/directus.ts`

- [ ] **Step 1: Implement** a helper that reads runtimeConfig and calls Directus with the token.

```ts
export function directus(event: any) {
  const cfg = useRuntimeConfig(event)
  return $fetch.create({
    baseURL: cfg.directusUrl as string,
    headers: { Authorization: `Bearer ${cfg.directusToken}` },
  })
}
```

- [ ] **Step 2: Verify** referenced by API tasks below (no standalone test; covered via endpoints).

### Task 2.3: Auth login/logout/me endpoints

**Files:** Create `server/api/auth/login.post.ts`, `server/api/auth/logout.post.ts`, `server/api/me.get.ts`

- [ ] **Step 1: `login.post.ts`** — read `{ identifier, password }`; query `cascade_users` by username OR email; compare password; on success set cookie.

```ts
export default defineEventHandler(async (event) => {
  const { identifier, password } = await readBody(event)
  const cfg = useRuntimeConfig(event)
  const api = directus(event)
  const res: any = await api('/items/cascade_users', {
    params: { filter: { _or: [{ username: { _eq: identifier } }, { email: { _eq: identifier } }] }, limit: 1 },
  })
  const user = res.data?.[0]
  if (!user || user.password !== password) {
    throw createError({ statusCode: 401, statusMessage: 'Falsche Zugangsdaten' })
  }
  setCookie(event, 'cascade_session', signSession(String(user.id), cfg.sessionSecret as string), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  })
  return { id: user.id, display_name: user.display_name, avatar_initials: user.avatar_initials }
})
```

- [ ] **Step 2: `logout.post.ts`** — `deleteCookie(event, 'cascade_session'); return { ok: true }`.

- [ ] **Step 3: `me.get.ts`** — verify cookie → fetch user → return public fields or `null`.

```ts
export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const id = verifySession(getCookie(event, 'cascade_session'), cfg.sessionSecret as string)
  if (!id) return { user: null }
  const api = directus(event)
  const res: any = await api(`/items/cascade_users/${id}`)
  const u = res.data
  return { user: u ? { id: u.id, display_name: u.display_name, avatar_initials: u.avatar_initials, streak: u.streak, started_at: u.started_at } : null }
})
```

- [ ] **Step 4: Verify** `yarn dev`; PowerShell:
`Invoke-RestMethod -Method Post http://localhost:3000/api/auth/login -Body (@{identifier='testuser-1';password='test1234'} | ConvertTo-Json) -ContentType 'application/json'` → returns display_name „Mara K.". Wrong password → 401.

### Task 2.4: Courses + lessons + progress endpoints

**Files:** Create `server/api/courses/index.get.ts`, `server/api/courses/[slug].get.ts`, `server/api/lessons/[id].get.ts`, `server/api/progress.post.ts`

- [ ] **Step 1: `courses/index.get.ts`** — fetch all courses (sorted), and for the logged-in user the count of done lessons per course; return courses with `{ doneCount, totalCount, percent }`.

- [ ] **Step 2: `courses/[slug].get.ts`** — fetch course by slug + its chapters (sorted) + lessons (sorted) + user's done lesson ids; compute per-lesson status: `done` if in progress set, `current` = first not-done lesson, else `locked` if after current, else `done`.

- [ ] **Step 3: `lessons/[id].get.ts`** — fetch one lesson with all fields incl. `assertions`, `solution`, plus its course slug + index („Lektion n / 15") + next lesson id.

- [ ] **Step 4: `progress.post.ts`** — body `{ lessonId }`; if logged in, upsert `cascade_progress` (skip if exists) with status done + completed_at; if guest, return `{ guest: true }` (client stores locally).

- [ ] **Step 5: Verify** PowerShell against `http://localhost:3000/api/courses` (with session cookie via `-WebSession`) → css-grundlagen has percent ~33. `/api/courses/css-grundlagen` → 4 chapters, 15 lessons with statuses. `/api/lessons/<id>` → returns assertions.

---

## Phase 3 — Checker logic (TDD)

### Task 3.1: Color normalization + assertion eval — TDD

**Files:** Create `app/utils/checker.ts`, `test/checker.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { normalizeColor, matchesExpected } from '../app/utils/checker'

describe('normalizeColor', () => {
  it('treats teal, #008080, rgb(0,128,128) as equal', () => {
    const a = normalizeColor('teal'), b = normalizeColor('#008080'), c = normalizeColor('rgb(0, 128, 128)')
    expect(a).toBe(b); expect(b).toBe(c)
  })
})
describe('matchesExpected', () => {
  it('matches color expectations regardless of format', () => {
    expect(matchesExpected('color', 'rgb(0, 128, 128)', 'teal')).toBe(true)
  })
  it('matches keyword props with whitespace/case tolerance', () => {
    expect(matchesExpected('text-align', 'center', 'CENTER')).toBe(true)
  })
  it('fails on mismatch', () => {
    expect(matchesExpected('text-align', 'left', 'center')).toBe(false)
  })
})
```

- [ ] **Step 2: Run** `yarn test test/checker.test.ts` → FAIL.

- [ ] **Step 3: Implement** (uses DOM `getComputedStyle` via a temp element to resolve named colors; happy-dom provides it).

```ts
const COLOR_PROPS = new Set(['color', 'background-color', 'border-color'])

export function normalizeColor(value: string): string {
  const el = document.createElement('div')
  el.style.color = value
  document.body.appendChild(el)
  const resolved = getComputedStyle(el).color
  el.remove()
  const m = resolved.match(/rg.*?\(([^)]+)\)/)
  if (!m) return value.trim().toLowerCase()
  const parts = m[1].split(',').map(s => s.trim())
  return `rgb(${parts.slice(0, 3).join(',')})`
}

export function matchesExpected(prop: string, actual: string, expected: string): boolean {
  if (COLOR_PROPS.has(prop) || prop.includes('color')) {
    return normalizeColor(actual) === normalizeColor(expected)
  }
  return actual.trim().toLowerCase() === expected.trim().toLowerCase()
}

export interface Assertion { selector: string; prop: string; expected: string }
export function evalAssertions(doc: Document, assertions: Assertion[]) {
  return assertions.map(a => {
    const el = doc.querySelector(a.selector)
    const actual = el ? getComputedStyle(el).getPropertyValue(a.prop) : ''
    return { ...a, actual, passed: !!el && matchesExpected(a.prop, actual, a.expected) }
  })
}
```

- [ ] **Step 4: Run** `yarn test test/checker.test.ts` → PASS.

---

## Phase 4 — Shared UI components

### Task 4.1: BrandLogo + LightCircles

**Files:** Create `app/components/BrandLogo.vue`, `app/components/LightCircles.vue`

- [ ] **Step 1: `BrandLogo.vue`** — inline SVG: 11px-radius teal rounded square with 3 descending rounded bars (18/13/8 px wide, 3px tall, decreasing opacity) + wordmark „Cascade" (`#1F2A28`) + „Academy" (`#0E7A70`), Bricolage 800. Prop `white?: boolean` for login (all-white variant).

- [ ] **Step 2: `LightCircles.vue`** — absolutely-positioned translucent white circles (`rgba(255,255,255,0.06–0.12)`) bleeding off edges; parent must be `relative overflow-hidden`. Props for count/positions with sensible defaults.

- [ ] **Step 3: Verify** Drop both on temp index page → logo + circles render.

### Task 4.2: ProgressBar + StatTile + LessonRow + CourseCard

**Files:** Create `app/components/ProgressBar.vue`, `StatTile.vue`, `LessonRow.vue`, `CourseCard.vue`

- [ ] **Step 1: `ProgressBar.vue`** — props `percent`, `variant` ('teal' default track `#EAF2F0` fill `#12B5A5`; 'onTeal' track `rgba(255,255,255,0.25)` fill white). 8px, radius 99px.

- [ ] **Step 2: `StatTile.vue`** — props `value`, `label`, `icon`, `accent` ('teal'|'orange'|'violet') → gradient + border + soft circle + white icon bubble per README secondary-accent table. Number Bricolage 32/800.

- [ ] **Step 3: `LessonRow.vue`** — props `lesson`, `status` ('done'|'current'|'locked'). Renders the three states exactly per README §2 (green ✓ circle / teal ▶ outline + „Starten →" / dashed locked). `current`/`done` clickable → emit/navigate.

- [ ] **Step 4: `CourseCard.vue`** — props `course` (+ progress). Active variant: gradient cover with `{ }` glyph, chips, ProgressBar, „Weiterlernen →"; hover lift. Locked variant: muted cover + 🔒 + single level chip + unlock hint, not clickable.

- [ ] **Step 5: Verify** Temporarily render samples on index page; compare to screenshots `1`/`2`.

---

## Phase 5 — Screens

### Task 5.1: AppNav + default layout polish

**Files:** Modify `app/components/AppNav.vue`, `app/layouts/default.vue`

- [ ] **Step 1: `AppNav.vue`** — BrandLogo (links → `/kurse`), nav links „Kurse" (`/kurse`), „Profil" (`/profil`) with active pill (`#DFF6F3` bg, `#0E7A70` text via `useRoute`), and avatar circle (initials from `useAuth`, → `/login`). White bar, bottom border.

- [ ] **Step 2: Verify** Nav shows on `/kurse`, active state correct; hidden on `/login` (login uses `blank` layout).

### Task 5.2: Login page

**Files:** Create `app/pages/login.vue`, `app/composables/useAuth.ts`

- [ ] **Step 1: `useAuth.ts`** — `useState` user; `fetchMe()` (GET /api/me), `login(identifier,password)` (POST), `logout()`. 

- [ ] **Step 2: `login.vue`** — `definePageMeta({ layout: 'blank' })`. Split layout per README §0: left teal brand panel (gradient `150deg,#0E7A70,#12B5A5`, logo white, title „Schön, dass du wieder da bist.", 3 feature check-chips, testimonial, 2 light circles); right 480px white panel, form capped 340px: E-Mail/„Benutzername" + Passwort fields (focus ring), „vergessen?" link, „Anmelden" button → `login()` → on success `navigateTo('/kurse')`; „oder" divider; „Ohne Konto loslernen" (teal-soft) → set guest flag → `/kurse`; footer „Konto erstellen". Show error on 401.

- [ ] **Step 3: Verify** `/login` matches `0-login.png`; login with testuser-1/test1234 → redirected to `/kurse`; wrong creds → German error shown.

### Task 5.3: Course overview

**Files:** Create `app/pages/kurse/index.vue`

- [ ] **Step 1: Implement** — `useFetch('/api/courses')`. Hero banner (gradient, radius 22, 2 light circles, pill „CSS lernen by doing", title „Schreib echtes CSS, sieh es sofort.", subtitle, white CTA „Weiterlernen →" → active course detail, „8 von 25…" replaced with real „X von Y Lektionen geschafft"). „Deine Kurse" heading + `N Kurse`. 3-col grid of `CourseCard`. Active card → `/kurse/[slug]`.

- [ ] **Step 2: Verify** Matches `1-kursuebersicht.png`; counts reflect seeded progress; locked cards not clickable.

### Task 5.4: Course detail

**Files:** Create `app/pages/kurse/[slug].vue`

- [ ] **Step 1: Implement** — `useFetch('/api/courses/'+slug)`. Back link „← Alle Kurse" → `/kurse`. Header banner (chips „Anfänger", „15 Lektionen · 4 Kapitel", title, description, onTeal ProgressBar + „X % · d / 15"). Chapter blocks: heading + status badge („abgeschlossen"/„in Arbeit"), `LessonRow` list. Current/done row → `/lektion/[id]`.

- [ ] **Step 2: Verify** Matches `2-kursdetail.png`; statuses correct (done/current/locked); counts say 15/4.

### Task 5.5: Lesson editor — CodeEditor + LivePreview + CheckPanel

**Files:** Create `app/components/lesson/CodeEditor.vue`, `LivePreview.vue`, `CheckPanel.vue`

- [ ] **Step 1: `CodeEditor.vue`** — CodeMirror 6 wrapper. Props `modelValue`, `theme` ('light'|'dark'), `readonly?`. CSS language; custom theme colors per README code-theme table (light + dark); gutter line numbers. Emit `update:modelValue`. Recreate view on theme change (or use compartments).

- [ ] **Step 2: `LivePreview.vue`** — props `html`, `css`. Renders `<iframe sandbox="allow-same-origin" srcdoc>` combining `<style>${css}</style>${html}`. Exposes the iframe document for checking (ref + method `getDoc()`), or re-checks via a passed callback. Header „LIVE-VORSCHAU" + green „● aktualisiert".

- [ ] **Step 3: `CheckPanel.vue`** — props `results` ([{selector,prop,expected,passed}]), `total`, `passed`. „PRÜFUNG" + „x / n erfüllt"; per-assertion row (green ✓ circle vs hollow outline, mono `selector · prop: expected`). „Code prüfen" button emits `check`.

- [ ] **Step 4: Verify** Mount standalone with the L5 sample (h1 teal/center) → editing CSS updates preview; „Code prüfen" → 2/2 erfüllt when solution entered.

### Task 5.6: Lesson editor page

**Files:** Create `app/pages/lektion/[id].vue`, `app/composables/useGuestProgress.ts`

- [ ] **Step 1: `useGuestProgress.ts`** — localStorage-backed set of done lesson ids (for guests): `isDone(id)`, `markDone(id)`.

- [ ] **Step 2: `lektion/[id].vue`** — `useFetch('/api/lessons/'+id)`. One white panel (radius 18). Top bar (back → detail, breadcrumb course › chapter, title, **Hell/Dunkel** segmented switch → `codeTheme` default 'dark', „Lektion n / 15" + 130px ProgressBar, ✕ → detail). Task strip (`#DFF6F3`, eyebrow „DEINE AUFGABE", task with inline `code` chips rendered from backticks, „💡 Hinweis" toggles `hint`). 2-col body 55/45: left HTML read-only `CodeEditor` + CSS `CodeEditor` (themed); right `LivePreview` + `CheckPanel`. „Code prüfen" → run `evalAssertions(previewDoc, assertions)` → update results; all passed enables „Weiter →". Footer „← Zurück", „Lösung anzeigen" (set css = solution), „Weiter →" → POST `/api/progress` (or guest markDone) → navigate to next lesson id (or back to detail if last).

- [ ] **Step 3: Verify** Matches `3-lektion-dunkel.png` (default) + `3-lektion-hell.png` (after toggle); typing solution → 2/2, „Weiter →" enabled; clicking it marks progress (re-open detail shows the lesson done).

### Task 5.7: Profile page + ChatPanel (static)

**Files:** Create `app/pages/profil.vue`, `app/components/ChatPanel.vue`, `app/utils/chatMock.ts`

- [ ] **Step 1: `chatMock.ts`** — static arrays: online users for „Alle" (14) and „Mein Kurs" (5) incl. a mentor (orange badge) and „Du" row; thread messages (incoming/own/mentor) with „Heute" divider.

- [ ] **Step 2: `ChatPanel.vue`** — 262px left rail (segmented „Alle · 14" / „Mein Kurs · 5" filter swaps list; rows = colored initials avatar + name + course tag; mentor badge; „Du" highlighted in „Mein Kurs") + thread (bubbles per README §4; input + 42px teal send → optimistic local append, not persisted).

- [ ] **Step 3: `profil.vue`** — identity banner (gradient `125deg`, 2 light circles, 76px avatar initials, name + „Lernt seit X Tagen · Fortschritt …", streak chip 🔥 + „n / Tage Streak"). 3 `StatTile` (📘 Lektionen erledigt teal, 🎯 Kapitel abgeschlossen orange, 📈 % CSS-Grundlagen violet) from `/api/courses` + `/api/me`. „Live-Chat · wer ist online" + „● N online" + `ChatPanel`.

- [ ] **Step 4: Verify** Matches `4-profil.png` and `4-profil-chat-meinkurs.png`; stats reflect seeded progress; filter toggle swaps list; sending a message appends a bubble.

---

## Phase 6 — Wiring & finish

### Task 6.1: Index redirect + auth gating

**Files:** Create/replace `app/pages/index.vue`; Create `app/middleware/auth.global.ts` (light)

- [ ] **Step 1: `index.vue`** — redirect to `/kurse` (`definePageMeta` + `navigateTo('/kurse', { redirectCode: 302 })` in setup, or a server redirect).

- [ ] **Step 2: Global middleware** — if not logged in and not guest and route ≠ `/login`, redirect to `/login`. (Guest flag in a cookie/localStorage set by „Ohne Konto loslernen".)

- [ ] **Step 3: Verify** Fresh browser → `/` → `/login`. After login or guest → `/kurse`. Logout (avatar → login) clears session.

### Task 6.2: Full manual pass + test run

- [ ] **Step 1: Run all unit tests** `yarn test` → all PASS (session + checker).

- [ ] **Step 2: Manual flow** Login → overview → detail → lesson (solve, check 2/2, next) → progress persists for testuser-1 (verify via PowerShell `cascade_progress` count increased) → profile stats update → logout. Compare every screen to its screenshot.

- [ ] **Step 3: Guest flow** „Ohne Konto loslernen" → solve a lesson → progress stored in localStorage (survives reload), not in Directus.

---

## Self-Review notes
- Spec coverage: §1 arch (T0.2/2.2), §2 schema (T1.2), §3 seed (T1.3), §4 lessons (T1.1), §5 routes (T5.x/6.1), §6 editor+checker (T3.1/5.5/5.6), §7 API (T2.x), §8 design system (T0.3/4.x), §9 chat (T5.7), §10 scope honored (no auth hashing, static chat, locked courses).
- TDD applied to pure logic (session, checker); visual screens verified against screenshots.
- Types consistent: `Assertion {selector,prop,expected}`, result adds `{actual,passed}`; `signSession/verifySession`; status `'done'|'current'|'locked'`.

# Handoff: Cascade Academy — CSS-Lernplattform

## Overview
Cascade Academy is a browser-based platform for learning CSS "by doing": short
lessons, a code editor with live preview, automatic checking of each task, plus
light gamification (streak, stats) and a live chat. This package documents the
**high-fidelity** design for five screens: **Login, Course Overview (Kursübersicht),
Course Detail (Kursdetail), Lesson Editor (Lektion), and Profile (Profil)**.

The product is German-language (all UI copy is in German). Keep the copy as-is
unless localization is explicitly requested.

> **Visual direction: DARK theme.** The design uses a near-black teal-tinted
> background with dark surfaces, **teal (`#12B5A5`) as a glowing accent**, and large
> bold display typography. High contrast, confident, modern — deliberately not
> "soft/playful". Primary buttons are solid teal with **dark** text. This dark
> direction is the single intended style across all five screens.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes
showing the intended look and behavior. They are **not production code to copy
directly**. The HTML files are authored as "Design Components" (a prototyping
format) and use inline styles + a small runtime; do **not** ship that runtime.

Your task is to **recreate these designs in the target codebase's environment**
using its established patterns, component library, and conventions. If no
codebase exists yet, React + a modern CSS approach (CSS Modules, Tailwind, or
styled-components) is a natural fit for this design — but choose whatever best
matches the project.

The single source of truth for the final design is **`Cascade Academy.dc.html`**
(all five hifi screens, dark theme). The other files are earlier-stage references
(see Files).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions are all
specified below. Recreate the UI pixel-perfectly using the codebase's existing
libraries and patterns. The wireframe file (`Wireframes - LernCSS.dc.html`) is
**low-fidelity** and included only as a structural/flow reference (its light look
is superseded by the dark theme).

---

## Design Tokens (Dark Theme)

### Colors — core
| Token | Hex / value | Usage |
|---|---|---|
| `--bg` | `#0B1715` | App background (near-black, teal-tinted) |
| `--surface` | `#11201D` | Cards, panels, hero/banner base |
| `--surface-locked` | `#0F1C19` | Locked/disabled course cards |
| `--inset` | `rgba(255,255,255,0.04)` | Inset blocks (inputs, check panel) |
| `--inset-2` | `rgba(255,255,255,0.06)` | Neutral chips, incoming chat bubbles |
| `--border` | `rgba(255,255,255,0.08)` | Default border/divider |
| `--border-strong` | `rgba(255,255,255,0.12)` | Inputs, icon buttons, stronger dividers |
| `--teal` (primary) | `#12B5A5` | Buttons, progress fill, brand icon, active accents, avatars |
| `--teal-text` | `#3FD9C9` | Teal **text/links on dark** (brighter for contrast) |
| `--teal-text-bright` | `#5FE0D2` | Eyebrows, inline code accent |
| `--on-teal` | `#06201C` | **Text/icons on top of teal fills** (dark, high-contrast) |
| `--teal-soft` | `rgba(18,181,165,0.13)` | Soft teal background (active nav, chips, task strip, mentor badge) |
| `--teal-soft-border` | `rgba(18,181,165,0.25)` | Borders on soft-teal surfaces |
| `--success` | `#2BD68A` | Check marks, "done", online dots, "aktualisiert" |
| `--success-soft` | `rgba(43,214,138,0.13)` | "abgeschlossen" badge background |
| `--text` | `#fff` | Headings, key numbers, names |
| `--text-body` | `#E6F2EF` | Body text, list items |
| `--text-muted` | `#9DBDB6` | Secondary text (descriptions, subtitles) |
| `--text-soft` | `#7FA39C` | Tertiary/labels/meta |
| `--text-faint` | `#5C7A74` | Disabled, placeholders, hints |

> **Teal glow** (hero/banner accent): a radial gradient in the top-right corner over
> the dark surface, e.g.
> `radial-gradient(130% 150% at 86% -30%, rgba(18,181,165,0.42) 0%, rgba(18,181,165,0.06) 42%, rgba(255,255,255,0) 68%), #11201D`.
> The signature "light circles" become very faint white (`rgba(255,255,255,0.035)`)
> or teal-tinted radial circles bleeding off the edges.

### The one bright moment
The **login left panel** and the **active course card cover** keep a solid teal
gradient (`linear-gradient(150deg,#0E7A70,#12B5A5)` / `130deg,#12B5A5,#0E7A70`) as
an intentional brand "pop" against the dark UI. The **live-preview box** in the
Lesson editor stays **white** — it renders a real webpage, so it must look like one.
Everything else is dark.

### Code editor themes (Lesson — user-switchable Hell/Dunkel)
The code blocks (read-only HTML + editable CSS) have their **own** light/dark toggle,
independent of the app's (always-dark) chrome. Default = **Dark**.
| Token | Light (Hell) | Dark (Dunkel) |
|---|---|---|
| code bg | `#FBFAF6` | `#1B1A2E` |
| code surface (HTML block) | `#F3F0E9` | `#16162A` |
| code edge/border | `#E6DED3` | `#2A2942` |
| gutter bg | `#F1EDE6` | `#161628` |
| gutter text | `#BBB2A7` | `#565273` |
| code text | `#3A332E` | `#E6E3F5` |
| code muted (readonly) | `#9A9189` | `#8E89A8` |
| syntax: selector/tag | `#1F2937` | `#FFCB6B` |
| syntax: property | `#2563EB` | `#82AAFF` |
| syntax: value | `#15803D` | `#C3E88D` |

### Typography
- **Display / headings:** `Bricolage Grotesque` (500/600/700/800), letter-spacing
  -0.3 to -0.6px on large sizes; the profile hero number runs to 64px / -2px tracking.
- **UI / body:** `Plus Jakarta Sans` (400/500/600/700).
- **Code / mono:** `JetBrains Mono` (400/500/700).

Type scale (approx px): profile big-stat 64 · hero title 38 · screen title 30 / 27 / 26
· card title 20–22 · section heading 18 · body 15–17 · label/meta 12.5–14 · uppercase
eyebrow 11.5–12 (letter-spacing 0.6–1.2px, `text-transform:uppercase`).

### Radii
Pills/chips `999px` · large cards/banners/hero `18–22px` · cards `13–16px` · inputs &
inner blocks `10–13px` · small controls/icon buttons `9–11px` · brand icon `11px`.

### Shadows (used sparingly on dark)
- Teal button: `0 12px 26px -10px rgba(18,181,165,0.7–0.8)`
- Current-lesson row glow: `0 14px 30px -16px rgba(18,181,165,0.6)`
- Teal avatar / brand icon: `0 12px 26px -12px rgba(18,181,165,0.8)`
- Focus ring (inputs): border `#12B5A5` + `0 0 0 3px rgba(18,181,165,0.18)`
- On dark, **borders do most of the elevation work** — prefer 1px `--border` over big shadows.

### Spacing
Page max-width: **1180px** (overview/lesson), **920px** (detail/profile).
Page padding: ~28–32px horizontal. Card padding: 18–24px. Grid/flex gaps: 16–22px.

### Hover / focus
- Active course card: `translateY(-3px)` + border → `rgba(18,181,165,0.4)`.
- Teal buttons: fill `#12B5A5` → `#3FD9C9` on hover (text stays `#06201C`).
- Secondary teal button: `rgba(18,181,165,0.12)` → `rgba(18,181,165,0.2)`.
- Inputs: focus ring as above.

---

## Screens / Views

### 0 · Login
- **Purpose:** Sign in, or start without an account (progress stored locally).
- **Layout:** full-height split. Left = flexible **teal-gradient** brand panel
  (the bright moment); right = fixed **480px** **dark** (`#0B1715`) form panel,
  content capped at 340px, vertically centered. Top app nav hidden here.
- **Left brand panel:** teal gradient, 48px padding, space-between column, two
  off-edge white light-circles. Logo (white), title "Schön, dass du wieder da bist."
  (Bricolage 32/800), subtitle, 3 feature rows (24px check chips), testimonial at bottom.
- **Right form (dark):** "Willkommen zurück" (28/800 white) + muted subtitle.
  Inputs: bg `rgba(255,255,255,0.04)`, border `--border-strong`, white text, teal
  focus ring; labels `#E6F2EF`. "vergessen?" link `--teal-text`. Primary **Anmelden**
  = solid teal, `#06201C` text. "oder" divider. Secondary **Ohne Konto loslernen** =
  `--teal-soft` bg + `--teal-soft-border`, `--teal-text`. Footer "Neu hier? **Konto erstellen**".
- **Behavior:** Anmelden / Ohne Konto / Konto erstellen → Course Overview.

### 1 · Course Overview (Kursübersicht)
- **Layout:** max-width 1180px. Dark **hero with teal glow**, then "Deine Kurse"
  heading row, then **3-column course-card grid** (gap 22px).
- **Hero:** dark surface + corner teal-glow radial, faint white circle, 1px border.
  Pill "CSS lernen by doing" (`--teal-soft` bg, `--teal-text-bright`). Title "Schreib
  echtes CSS, sieh es **sofort**." (38/800 white; "sofort" in `--teal-text`). Muted
  subtitle. Teal CTA "Weiterlernen →" (`#06201C` text) + soft meta "8 von 25 …".
- **Course card (active):** dark surface, 1px border. Top: 120px **teal-gradient**
  cover with `{ }` glyph (dark, low-opacity), off-edge white circle, white title.
  Body: teal chip ("Anfänger") + neutral chip ("25 Lektionen"); progress bar (track
  `rgba(255,255,255,0.1)`, fill teal) + "32 % · 8 / 25 Lektionen"; full-width teal
  button "Weiterlernen →" pinned bottom. Hover lifts + teal border. Click → Detail.
- **Course card (locked):** `--surface-locked`, faint border, `opacity:0.7`, dark
  muted cover (`#1B2F2A→#16241F`) with dimmed 🔒, one neutral chip + unlock hint.

### 2 · Course Detail (Kursdetail)
- **Layout:** max-width 920px. Back link "← Alle Kurse" → Overview. Dark **teal-glow
  header**, then chapter sections.
- **Header:** dark surface + corner teal-glow, faint circle, 1px border. Two chips
  (teal "Anfänger" + neutral "25 Lektionen · 5 Kapitel"), title "CSS-Grundlagen"
  (30/800 white), muted description, progress bar (track `rgba(255,255,255,0.12)`,
  fill teal) + "32 % · 8 / 25".
- **Chapter block:** white heading (18/700) + status badge — "abgeschlossen"
  (`--success` on `--success-soft`) or "in Arbeit" (`--teal-text` on `--teal-soft`).
- **Lesson row states:**
  - *Done:* dark surface, 26px **success** circle with `#06201C` ✓, body text, neutral type chip.
  - *Current:* bg `rgba(18,181,165,0.08)`, **2px teal border** + teal glow shadow;
    teal-outline ▶ circle; white title + `--teal-text` subtitle "Hier geht's weiter";
    teal "Starten →" button (`#06201C` text). Click → Lesson Editor.
  - *Locked:* transparent bg, **dashed** `--border-strong`, `opacity:0.55`, faint 🔒, soft text, "gesperrt".

### 3 · Lesson Editor (Lektion)  ← core screen
- **Layout:** max-width 1180px, one dark panel (`#11201D`, radius 18, 1px border)
  containing: top bar → task strip → **2-column body (55% / 45%)** → footer.
- **Top bar:** back-arrow icon btn (→ Detail), breadcrumb (soft) + title (white 20/700).
  Right: **Hell/Dunkel code switch** (segmented pill on `rgba(255,255,255,0.06)`; the
  active option = solid teal fill with `#06201C` text, inactive = `--text-soft`),
  "Lektion 12 / 25" + 130px progress bar (48%), ✕ close (→ Detail).
- **Task strip:** full-width `--teal-soft` band, `--teal-soft-border` bottom border.
  30px teal rounded-square with ✦ (`#06201C`), eyebrow "DEINE AUFGABE" (`--teal-text-bright`),
  task text (body) with inline mono code chip for `text-align`. "💡 Hinweis" button
  (`--inset` bg, border, `--teal-text`).
- **Left column (55%) — editor:** "HTML / vorgegeben" → read-only code block (themed,
  default dark `#16162A`) `<h1>Willkommen</h1>` / `<p>…</p>`. "CSS / dein Code" (teal
  chip) → editor block (themed bg, 42px line-number gutter) with syntax-highlighted
  `h1 { color: teal; text-align: center; }`. Colors per the code-theme table.
- **Right column (45%) — preview + check:**
  - "LIVE-VORSCHAU" + green "● aktualisiert". **White** preview box rendering the
    result: "Willkommen" heading in **`#008080`, centered** + two gray placeholder bars.
  - Check panel: `--inset` bg, 1px border, "PRÜFUNG" (white) + "1 / 2 erfüllt". Two
    mono rows: passed = success circle + ✓ ("h1 · color: teal"); pending = hollow
    `--border-strong` circle ("h1 · text-align: center"). Teal "Code prüfen" button.
- **Footer:** "← Zurück" (`--inset` bg/border, → Detail); "Lösung anzeigen" (soft text)
  + teal "Weiter →" (`#06201C` text).
- **The Hell/Dunkel switch only re-themes the two code blocks** (CSS variables scoped
  to the editor subtree). The surrounding chrome is always dark.

### 4 · Profile (Profil)  — direction "C · Bold & dunkel"
- **Layout:** max-width 920px. Identity row → big-progress stat → two stat cards → live chat.
- **Identity row:** 64px teal rounded-square avatar "MK" (`#06201C` initials, teal
  glow shadow); name "Mara Köhler" (26/800 white) + soft subline; right-aligned streak
  ("5" in `--teal-text` 30/800 + uppercase "TAGE STREAK"). **No emoji, no badges.**
- **Big-progress stat:** dark surface, 1px border, a teal radial-glow circle top-right.
  Huge "32**%**" (Bricolage 64/800 white; "%" in `--teal-text`) + muted "CSS-Grundlagen
  abgeschlossen", then a thin progress bar (track `rgba(255,255,255,0.1)`, fill teal).
- **Two stat cards:** dark surfaces, 1px border — "8 / Lektionen erledigt" and
  "1 / Kapitel abgeschlossen" (numbers Bricolage 28/800 white, labels soft).
- **Live chat:** heading "Live-Chat · wer ist online" (white) + "● 14 online" (success).
  Dark panel (1px border, min-height 360), **262px left rail** + flexible thread.
  - *Left rail:* filter segmented control — **"Alle · 14"** / **"Mein Kurs · 5"**
    (active = solid teal, `#06201C` text; inactive = `--text-soft`). Online-user list
    per filter: 30px teal-soft initials avatar (`--teal-text` initials) + name + soft
    course tag; **mentors** get a `--teal-soft` "Mentor" badge. In "Mein Kurs" the
    current user "Du" row is highlighted (`rgba(18,181,165,0.14)`, solid-teal avatar).
  - *Thread:* "Heute" divider, then bubbles — incoming (`--inset-2`, radius 13/13/13/4,
    body text), own (solid teal, `#06201C` text, radius 13/13/4/13), mentor
    (`rgba(18,181,165,0.12)` + `--teal-soft-border`). Code answers use mono +
    `--teal-text-bright`. Input row: placeholder "Nachricht schreiben…" (`--inset` bg) +
    42px teal send button "➤" (`#06201C`).

---

## Interactions & Behavior
- **Navigation** (single source, no real routing in the prototype):
  - Top nav: logo & "Kurse" → Overview; "Profil" → Profile; **avatar → Login**.
  - Overview hero CTA & active course card → Detail.
  - Detail current-lesson row / "Starten →" → Lesson Editor.
  - Lesson back-arrow / ✕ / "← Zurück" → Detail.
  - Login Anmelden / Ohne Konto / Konto erstellen → Overview.
  - Nav hidden on Login; active nav item = `--teal-soft` pill + `--teal-text`.
- **Code theme toggle (Lesson):** Hell/Dunkel switches only the code blocks.
- **Chat filter toggle (Profile):** "Alle" ↔ "Mein Kurs" swaps the user list.
- **Not yet wired (prototype stubs to implement):** real auth, the CSS editor
  (use CodeMirror/Monaco), the live-preview iframe, the checker, and chat send.

### The checker (key functional spec)
Each lesson defines assertions like `{ selector:'h1', prop:'color', expected:'teal' }`.
On "Code prüfen": render the user's HTML+CSS in a sandboxed iframe, then read
`getComputedStyle(el).getPropertyValue(prop)` for each assertion and compare to the
expected value (normalize, e.g. `teal`/`#008080`/`rgb(0,128,128)` are equal). Show
per-assertion pass/fail and a "x / n erfüllt" count; all-pass enables "Weiter →".

## State Management
- `screen`: `'login' | 'overview' | 'detail' | 'editor' | 'profile'` (→ real routes/URLs in prod).
- `codeTheme`: `'light' | 'dark'` (default `'dark'`; persist per user).
- `chatFilter`: `'all' | 'course'`.
- Lesson runtime (prod): `userCss` string, `checkResults[]`, `lessonProgress`.
- Course/lesson/chapter data + progress (local for guests; server-side once an account
  exists). Streak & stats derive from progress.
- Live chat: online-users list + messages (websocket/realtime in prod).

## Assets
- **No external image assets.** All visuals are CSS (dark surfaces, teal gradients,
  radial teal glows, off-edge circles) and Unicode/emoji glyphs (✦ ▶ ➤ ✓ 🔒 💡 ☀ ☾,
  `{ }`). The profile/stat emoji from the old light theme were **removed** — keep it
  emoji-light; swap any remaining glyphs for the codebase's icon set if one exists.
- **Logo:** the "cascade" mark = three descending rounded bars (18/13/8px wide, 3px
  tall, decreasing opacity) inside an 11px-radius **teal** rounded square — on dark,
  the bars are dark (`#06201C`). Recreate as inline SVG. Wordmark: "Cascade" (white) +
  "Academy" (`--teal-text`), Bricolage 800.
- **Fonts:** Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono (Google Fonts).
- **Illustrations:** not included — a style was explored (`Illustrations-Stile.dc.html`)
  but not finalized. Hero/cover/empty-states use dark surfaces + teal glow for now.

## Screenshots
Rendered references in `screenshots/` (high-res, correct fonts, **dark theme**):
- `0-login.png` — Login (teal panel + dark form)
- `1-kursuebersicht.png` — Course Overview (dark hero + course grid)
- `2-kursdetail.png` — Course Detail (chapters & lesson states)
- `3-lektion-dunkel.png` — Lesson Editor, **dark** code theme (default)
- `3-lektion-hell.png` — Lesson Editor, **light** code theme (toggle on)
- `4-profil.png` — Profile (identity, big stat, chat — "Alle" filter)
- `4-profil-chat-meinkurs.png` — Profile chat with "Mein Kurs" filter active

## Files
- **`Cascade Academy.dc.html`** — ⭐ the complete hi-fi design, all five screens, dark theme. Primary reference.
- `Profil-Varianten.dc.html` — the three profile style explorations (A clean / B editorial / C dark). **Direction C was chosen** and applied platform-wide. Reference only.
- `Lektion Hi-Fi.dc.html` — earlier hifi study of the Lesson screen with a 4-palette + light/dark explorer (how the teal palette was chosen). Reference only.
- `Illustrations-Stile.dc.html` — four candidate illustration styles (undecided). Reference only.
- `Wireframes - LernCSS.dc.html` — original **low-fidelity** wireframes for all four core screens incl. the 3 lesson-layout variants (Variant A was chosen). Structure/flow reference.

> Note: `.dc.html` files include a small prototyping runtime and inline styles.
> Read them for layout/values; do not ship the runtime. Open any file in a browser to view it.

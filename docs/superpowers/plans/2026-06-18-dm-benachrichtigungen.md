# DM-Benachrichtigungen (Badge + Toast) — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eingeloggte Nutzer:innen sehen auf **jeder** Seite, dass eine private Nachricht angekommen ist — per Zähler-Badge am Profil-Icon und per klickbarem Toast, der direkt in die DM springt.

**Architecture:** `useChat()` wird zum Singleton (State via `useState`, **eine** modulweite EventSource), und die Verbindung läuft app-weit über das default-Layout statt nur auf der Profil-Seite. Die „benachrichtigen?"-Entscheidung wird als reine Funktion ausgelagert und unit-getestet.

**Tech Stack:** Nuxt 4 (Composables, `useState`), Vue 3 `<script setup>`, lucide-vue-next, Vitest (+ happy-dom).

**Spec:** [docs/superpowers/specs/2026-06-18-dm-benachrichtigungen-design.md](../specs/2026-06-18-dm-benachrichtigungen-design.md)

---

## Dateiübersicht

| Datei | Verantwortung |
|---|---|
| `app/utils/chatNotify.ts` | **neu** — reine `shouldNotifyDm(...)`-Entscheidung |
| `test/chatNotify.test.ts` | **neu** — Unit-Tests dazu |
| `app/composables/useChat.ts` | Singleton-State, modulweite EventSource, `dmUnread`, Toast-Queue, `connect`/`disconnect` exportiert |
| `app/layouts/default.vue` | Verbindungs-Lebenszyklus + `<ChatToast />` |
| `app/components/ChatToast.vue` | **neu** — gestapelte, klickbare Toasts mit Auto-Dismiss |
| `app/components/AppNav.vue` | DM-Badge am Profil-Link |

---

## Task 1: Reine Benachrichtigungs-Logik `shouldNotifyDm`

**Files:**
- Create: `app/utils/chatNotify.ts`
- Test: `test/chatNotify.test.ts`

- [ ] **Step 1: Failing test schreiben**

`test/chatNotify.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { shouldNotifyDm } from '../app/utils/chatNotify'
import type { RoutableMessage } from '../app/utils/chatRouting'

const me = '10'
const other = '11'

function general(): RoutableMessage {
  return { userId: other, name: 'Tom B.', initials: 'TB', recipientId: null, recipientName: null, recipientInitials: null }
}
function dmFromMe(): RoutableMessage {
  return { userId: me, name: 'Mara K.', initials: 'MK', recipientId: other, recipientName: 'Tom B.', recipientInitials: 'TB' }
}
function dmToMe(): RoutableMessage {
  return { userId: other, name: 'Tom B.', initials: 'TB', recipientId: me, recipientName: 'Mara K.', recipientInitials: 'MK' }
}

describe('shouldNotifyDm', () => {
  it('notifies for a DM to me when another conversation is active', () => {
    expect(shouldNotifyDm(dmToMe(), me, 'general')).toBe(true)
  })
  it('does not notify when I am already viewing that conversation', () => {
    expect(shouldNotifyDm(dmToMe(), me, other)).toBe(false)
  })
  it('does not notify for my own outgoing DM', () => {
    expect(shouldNotifyDm(dmFromMe(), me, 'general')).toBe(false)
  })
  it('does not notify for general chat messages', () => {
    expect(shouldNotifyDm(general(), me, 'general')).toBe(false)
  })
})
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `yarn vitest run test/chatNotify.test.ts`
Expected: FAIL — `Failed to resolve import '../app/utils/chatNotify'` bzw. `shouldNotifyDm is not a function`.

- [ ] **Step 3: Minimale Implementierung**

`app/utils/chatNotify.ts`:

```ts
// Pure decision: should an incoming chat message raise a DM notification
// (badge + toast) for the current user? No DOM / no network — unit-tested.

import { conversationKeyFor, type RoutableMessage } from './chatRouting'

/**
 * True only for a direct message addressed to me, sent by someone else, whose
 * conversation I am not currently viewing. General-chat messages never notify.
 */
export function shouldNotifyDm(msg: RoutableMessage, myId: string, activeKey: string): boolean {
  if (!msg.recipientId) return false        // general chat
  if (msg.userId === myId) return false     // my own outgoing message
  return conversationKeyFor(msg, myId) !== activeKey
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

Run: `yarn vitest run test/chatNotify.test.ts`
Expected: PASS (4 passing).

- [ ] **Step 5: Commit**

```bash
git add app/utils/chatNotify.ts test/chatNotify.test.ts
git commit -m "feat(chat): pure shouldNotifyDm decision + tests"
```

---

## Task 2: `useChat()` zum Singleton mit Badge-Count + Toast-Queue

**Files:**
- Modify (Rewrite): `app/composables/useChat.ts`

Das Composable wird vollständig ersetzt. Kernänderungen ggü. heute:
`onMounted/onBeforeUnmount` **entfernt** (die Verbindung steuert ab jetzt das
Layout, Task 3); State liegt in `useState` (geteilt); EventSource ist
modulweites Singleton; neu: `dmUnread`, `toasts`, `pushToast`, `dismissToast`
und der Toast-Trigger im `message`-Handler.

- [ ] **Step 1: Datei komplett ersetzen**

`app/composables/useChat.ts`:

```ts
import { conversationKeyFor, partnerOf, type Partner } from '~/utils/chatRouting'
import { shouldNotifyDm } from '~/utils/chatNotify'

export interface ChatMessage {
  id: string | number
  userId: string
  name: string
  initials: string
  text: string
  created_at: string
  recipientId: string | null
  recipientName: string | null
  recipientInitials: string | null
}

export interface OnlineUser {
  id: string
  name: string
  initials: string
}

export interface Conversation extends Partner {
  unread: number
  lastText: string
  lastAt: string
}

export interface ChatToastEntry {
  id: number
  partnerKey: string
  partnerName: string
  partnerInitials: string
  text: string
}

// One EventSource per browser tab, kept open across page navigation.
let es: EventSource | null = null
// Monotonic local id for toasts (avoids Date.now()).
let toastSeq = 0

/**
 * Live chat over SSE with a general room + 1:1 direct messages.
 * State is shared via useState so the navigation badge, the toast layer and the
 * chat panel all read the same picture from a single connection. Connection
 * lifecycle is owned by the default layout (connect/disconnect), not this call.
 */
export function useChat() {
  const { user } = useAuth()
  const myId = computed(() => (user.value ? String(user.value.id) : ''))

  const general = useState<ChatMessage[]>('chat:general', () => [])
  const rawDms = useState<ChatMessage[]>('chat:rawDms', () => [])
  const online = useState<OnlineUser[]>('chat:online', () => [])
  const openedPartners = useState<Partner[]>('chat:openedPartners', () => []) // DMs opened from a profile
  const activeKey = useState<string>('chat:activeKey', () => 'general')
  const unread = useState<Record<string, number>>('chat:unread', () => ({}))
  const connected = useState<boolean>('chat:connected', () => false)
  const toasts = useState<ChatToastEntry[]>('chat:toasts', () => [])

  // Bucket DM messages by conversation partner.
  const dms = computed(() => {
    const map: Record<string, ChatMessage[]> = {}
    for (const m of rawDms.value) {
      const key = conversationKeyFor(m, myId.value)
      ;(map[key] ??= []).push(m)
    }
    return map
  })

  const partners = computed(() => {
    const map: Record<string, Partner> = {}
    for (const m of rawDms.value) {
      const p = partnerOf(m, myId.value)
      if (p) map[p.id] = p
    }
    for (const p of openedPartners.value) map[p.id] ??= p
    return map
  })

  const conversations = computed<Conversation[]>(() =>
    Object.values(partners.value)
      .map((p) => {
        const msgs = dms.value[p.id] ?? []
        const last = msgs[msgs.length - 1]
        return { ...p, unread: unread.value[p.id] ?? 0, lastText: last?.text ?? '', lastAt: last?.created_at ?? '' }
      })
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt)),
  )

  const generalUnread = computed(() => unread.value.general ?? 0)

  // Total unread across DM conversations only (general excluded) — nav badge.
  const dmUnread = computed(() =>
    Object.entries(unread.value).reduce((sum, [key, n]) => (key === 'general' ? sum : sum + n), 0),
  )

  function messagesFor(key: string): ChatMessage[] {
    return key === 'general' ? general.value : (dms.value[key] ?? [])
  }

  function setActive(key: string) {
    activeKey.value = key
    unread.value = { ...unread.value, [key]: 0 }
  }

  function openConversation(u: Partner) {
    if (!openedPartners.value.some((p) => p.id === u.id)) {
      openedPartners.value = [...openedPartners.value, u]
    }
    setActive(u.id)
  }

  function bump(key: string) {
    if (activeKey.value === key) return
    unread.value = { ...unread.value, [key]: (unread.value[key] ?? 0) + 1 }
  }

  function pushToast(entry: Omit<ChatToastEntry, 'id'>) {
    toasts.value = [...toasts.value, { ...entry, id: ++toastSeq }]
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  // ----- SSE -----
  function connect() {
    if (!import.meta.client || es) return
    es = new EventSource('/api/chat/stream')

    es.addEventListener('open', () => { connected.value = true })

    es.addEventListener('snapshot', (e) => {
      const d = JSON.parse((e as MessageEvent).data)
      general.value = d.general ?? []
      rawDms.value = d.dms ?? []
      online.value = d.online ?? []
      unread.value = {} // reset on (re)connect; we have the full picture again
      toasts.value = []
    })

    es.addEventListener('message', (e) => {
      const m = JSON.parse((e as MessageEvent).data) as ChatMessage
      if (!m.recipientId) {
        general.value = [...general.value, m]
        bump('general')
      } else {
        rawDms.value = [...rawDms.value, m]
        const key = conversationKeyFor(m, myId.value)
        bump(key)
        if (shouldNotifyDm(m, myId.value, activeKey.value)) {
          const p = partnerOf(m, myId.value)
          if (p) pushToast({ partnerKey: key, partnerName: p.name, partnerInitials: p.initials, text: m.text })
        }
      }
    })

    es.addEventListener('presence', (e) => {
      online.value = JSON.parse((e as MessageEvent).data).online ?? []
    })

    es.addEventListener('error', () => { connected.value = false })
  }

  function disconnect() {
    es?.close()
    es = null
    connected.value = false
  }

  return {
    general, dms, online, conversations, online_count: computed(() => online.value.length),
    activeKey, generalUnread, dmUnread, connected, toasts,
    messagesFor, setActive, openConversation, send,
    connect, disconnect, pushToast, dismissToast,
  }

  async function send(text: string) {
    const t = text.trim()
    if (!t) return
    const recipientId = activeKey.value === 'general' ? undefined : activeKey.value
    await $fetch('/api/chat/messages', { method: 'POST', body: { text: t, recipientId } })
    // Echo arrives via SSE broadcast — no optimistic append.
  }
}
```

> **Hinweis:** `send` ist eine hoisted Funktionsdeklaration und darf daher nach
> dem `return` stehen (wie hier), oder vor dem `return` platziert werden — beides
> funktioniert. Wichtig ist nur: **`onMounted`/`onBeforeUnmount` sind entfernt**.

- [ ] **Step 2: Vollständige Test-Suite laufen lassen (Regression)**

Run: `yarn test`
Expected: PASS — alle bisherigen Tests (Session, Checker, Profil-Status, Chat-Routing) plus `chatNotify` grün. Kein Test referenziert die entfernten Lifecycle-Hooks.

- [ ] **Step 3: Typecheck/Build der Server- und Client-Routen**

Run: `yarn build`
Expected: Build grün. (Verifiziert, dass `useState`/`computed`-Auto-Imports und die geänderte Rückgabe von `useChat()` von `ChatPanel.vue` weiter aufgelöst werden.)

- [ ] **Step 4: Commit**

```bash
git add app/composables/useChat.ts
git commit -m "feat(chat): shared singleton state, dmUnread, toast queue"
```

---

## Task 3: Verbindung app-weit + Toast-Layer im default-Layout

**Files:**
- Modify: `app/layouts/default.vue`

- [ ] **Step 1: Layout ersetzen**

`app/layouts/default.vue`:

```vue
<script setup lang="ts">
// The chat connection lives for as long as the authenticated app is mounted.
// The default layout persists across page navigation, so the SSE stream stays
// open everywhere; the login page uses the `blank` layout and never connects.
const { connect, disconnect } = useChat()

onMounted(connect)
onBeforeUnmount(disconnect)
</script>

<template>
  <div class="min-h-screen">
    <AppNav />
    <main class="mx-auto max-w-[1180px] px-7 py-7"><slot /></main>
    <ChatToast />
  </div>
</template>
```

- [ ] **Step 2: Build laufen lassen**

Run: `yarn build`
Expected: Build grün. (`ChatToast` wird in Task 4 angelegt — falls dieser Schritt **vor** Task 4 ausgeführt wird, schlägt der Build mit „Failed to resolve component ChatToast" fehl; in diesem Fall Task 4 zuerst umsetzen und dann erneut bauen.)

> **Reihenfolge-Hinweis für die ausführende Person/Subagent:** Tasks 3 und 4
> gehören zusammen. Wenn du sequenziell arbeitest, setze **Task 4 vor dem Build
> aus Schritt 2** um, oder committe Task 3 und baue erst nach Task 4.

- [ ] **Step 3: Commit**

```bash
git add app/layouts/default.vue
git commit -m "feat(chat): keep SSE connection app-wide via default layout"
```

---

## Task 4: `ChatToast`-Komponente (klickbar, Auto-Dismiss)

**Files:**
- Create: `app/components/ChatToast.vue`

- [ ] **Step 1: Komponente anlegen**

`app/components/ChatToast.vue`:

```vue
<script setup lang="ts">
import { MessageCircle, X } from 'lucide-vue-next'
import type { ChatToastEntry } from '~/composables/useChat'

const chat = useChat()
const { toasts } = chat
const router = useRouter()

// Each toast auto-dismisses ~5s after it appears.
const timers = new Map<number, ReturnType<typeof setTimeout>>()

watch(
  toasts,
  (list) => {
    for (const t of list) {
      if (!timers.has(t.id)) {
        timers.set(t.id, setTimeout(() => dismiss(t.id), 5000))
      }
    }
  },
  { deep: true, immediate: true },
)

function dismiss(id: number) {
  const handle = timers.get(id)
  if (handle) {
    clearTimeout(handle)
    timers.delete(id)
  }
  chat.dismissToast(id)
}

function open(t: ChatToastEntry) {
  dismiss(t.id)
  chat.openConversation({ id: t.partnerKey, name: t.partnerName, initials: t.partnerInitials })
  router.push('/profil')
}

onBeforeUnmount(() => {
  for (const h of timers.values()) clearTimeout(h)
  timers.clear()
})
</script>

<template>
  <div class="pointer-events-none fixed z-50 flex flex-col" style="top: 78px; right: 24px; gap: 10px; width: 320px; max-width: calc(100vw - 48px)">
    <TransitionGroup name="toast">
      <button
        v-for="t in toasts"
        :key="t.id"
        type="button"
        class="pointer-events-auto flex w-full items-start gap-[11px] border border-border bg-surface text-left shadow-card transition-colors hover:bg-inset-2"
        style="border-radius: 14px; padding: 13px 14px"
        @click="open(t)"
      >
        <span
          class="flex shrink-0 items-center justify-center rounded-full font-semibold"
          style="width: 34px; height: 34px; background: rgba(18,181,165,0.13); color: #3FD9C9; font-size: 12px"
        >{{ t.partnerInitials }}</span>
        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-[6px] font-display font-bold text-text" style="font-size: 14px">
            <MessageCircle :size="14" class="shrink-0 text-teal-700" />
            Neue Nachricht von {{ t.partnerName }}
          </span>
          <span class="mt-[2px] block truncate font-medium text-text-faint" style="font-size: 12.5px">{{ t.text }}</span>
        </span>
        <span
          class="shrink-0 text-text-faint transition-colors hover:text-text"
          aria-hidden="true"
          @click.stop="dismiss(t.id)"
        ><X :size="15" /></span>
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
```

> **Design-Tokens** stammen aus `main.css` (`bg-surface`, `border-border`,
> `text-text-faint`, `text-teal-700`, `shadow-card`, `bg-inset-2`) — identisch
> zu den vorhandenen Komponenten. Lucide-Icons werden pro Komponente importiert.

- [ ] **Step 2: Build laufen lassen**

Run: `yarn build`
Expected: Build grün (inkl. `default.vue`, das `<ChatToast />` jetzt auflösen kann).

- [ ] **Step 3: Commit**

```bash
git add app/components/ChatToast.vue
git commit -m "feat(chat): clickable DM toast layer"
```

---

## Task 5: DM-Badge am Profil-Link in der Navigation

**Files:**
- Modify: `app/components/AppNav.vue`

- [ ] **Step 1: `useChat()` einbinden und Badge rendern**

In `app/components/AppNav.vue` den `<script setup>`-Block um den Chat-Count ergänzen:

```ts
<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'

const route = useRoute()
const { user, fetchMe } = useAuth()
const { dmUnread } = useChat()

onMounted(() => {
  fetchMe().catch(() => {})
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
```

Anschließend den Profil-`NuxtLink` durch eine Variante mit relativem Wrapper und
Badge ersetzen. Vorher:

```html
        <NuxtLink
          to="/profil"
          class="rounded-pill px-[14px] py-[8px] font-semibold no-underline transition-colors"
          :class="isActive('/profil') ? 'bg-teal-soft text-teal-700' : 'text-text-muted'"
          style="font-size: 14px"
        >Profil</NuxtLink>
```

Nachher:

```html
        <NuxtLink
          to="/profil"
          class="relative rounded-pill px-[14px] py-[8px] font-semibold no-underline transition-colors"
          :class="isActive('/profil') ? 'bg-teal-soft text-teal-700' : 'text-text-muted'"
          style="font-size: 14px"
        >
          Profil
          <span
            v-if="dmUnread"
            class="absolute flex items-center justify-center rounded-full bg-teal-600 font-bold text-on-teal shadow-btn"
            style="top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; font-size: 11px; line-height: 1"
          >{{ dmUnread }}</span>
        </NuxtLink>
```

- [ ] **Step 2: Build laufen lassen**

Run: `yarn build`
Expected: Build grün.

- [ ] **Step 3: Volle Test-Suite (Sicherheitsnetz)**

Run: `yarn test`
Expected: PASS — unverändert grün.

- [ ] **Step 4: Commit**

```bash
git add app/components/AppNav.vue
git commit -m "feat(chat): DM unread badge on profile nav link"
```

---

## Task 6: Manueller Smoke-Test (vor Release)

> Kein automatisierter Browsertest möglich (kein Browser im Sandbox-Tooling,
> siehe CONTEXT.md §8). Diese Schritte manuell durchführen.

- [ ] **Step 1: Dev-Server starten**

Run: `yarn dev`
Expected: erreichbar unter `http://localhost:3000`.

- [ ] **Step 2: Zwei Browser/Profile**

In Browser A als `testuser-1`, in Browser B als `testuser-2` einloggen (beide `test1234`).

- [ ] **Step 3: Benachrichtigung auf anderer Seite**

- Browser A auf eine **Kursseite** navigieren (nicht `/profil`).
- Browser B → Profil → `testuser-1` öffnen → **„Nachricht senden"** → DM abschicken.
- **Erwartung in Browser A:** Toast oben rechts („Neue Nachricht von Mara K./Tom B.") **und** Zähler-Badge am Profil-Icon.

- [ ] **Step 4: Toast-Klick**

- In Browser A auf den Toast klicken.
- **Erwartung:** landet auf `/profil` **direkt in der DM**; das Badge für diese Konversation ist weg.

- [ ] **Step 5: Kein Toast für Allgemein-Chat**

- Browser B schreibt im **Allgemeinen Chat**.
- **Erwartung in Browser A:** **kein** Toast, **kein** DM-Badge (nur der General-Unread-Zähler im Panel, falls Panel offen).

- [ ] **Step 6: Presence app-weit**

- **Erwartung:** Browser A erscheint in Browser B als **online**, obwohl A auf einer Kursseite (nicht Profil) ist.

---

## Self-Review (vom Plan-Autor durchgeführt)

- **Spec-Abdeckung:** §4.1 Singleton → Task 2; §4.2 app-weite Verbindung → Task 3;
  §4.3 Badge → Task 5; §4.4 Toast → Task 4; §4.5 reine Logik → Task 1;
  §9 Smoke-Test → Task 6. Alle Abschnitte abgedeckt.
- **Typkonsistenz:** `ChatToastEntry`-Felder (`id`, `partnerKey`, `partnerName`,
  `partnerInitials`, `text`) identisch in `useChat.ts` (Definition + `pushToast`)
  und `ChatToast.vue` (Verbrauch). `dmUnread`, `openConversation`,
  `dismissToast`, `toasts` werden aus `useChat()` exportiert und genau so
  konsumiert. `shouldNotifyDm(msg, myId, activeKey)` Signatur stimmt zwischen
  Util, Test und Aufrufstelle.
- **Keine Platzhalter:** alle Schritte enthalten vollständigen Code/Befehle.

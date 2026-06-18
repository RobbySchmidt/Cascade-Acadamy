# Spec: Private Chats (Direktnachrichten)

> Stand: 2026-06-18. Erweitert den Live-Chat (siehe `2026-06-18-live-chat-design.md`)
> um 1:1-Direktnachrichten neben dem Allgemein-Chat. Navigation über die linke Leiste
> als Konversations-Umschalter.

## Entscheidungen
- **Ein nullable `recipient`-Feld** auf `cascade_messages`: `null` = Allgemein-Chat,
  gesetzt = DM an diesen User. Keine separate Conversations-Collection (YAGNI für 1:1).
- **SSE-Routing:** DMs gehen nur an Absender + Empfänger; Allgemein an alle.
- **Navigation:** linke Leiste = Umschalter (Allgemeiner Chat · Direktnachrichten · Online).
- **Nur Accounts** dürfen DMs; Gäste lesen den Allgemein-Chat read-only.
- **Ungelesen-Badges** clientseitig (Reset bei Reload) — kein persistenter Lese-Status.

## Datenmodell
- `cascade_messages` bekommt `recipient` (FK→`cascade_users`, nullable) + Relation
  `cascade_messages.recipient → cascade_users` (in `directus-schema.ps1`, idempotent).
- Ein DM-Verlauf zwischen mir und X = Nachrichten mit
  `recipient != null` und (`user=ich` ∧ `recipient=X`) ∨ (`user=X` ∧ `recipient=ich`).

## Backend
- **`server/utils/chatHub.ts`**
  - `ChatMessage` erhält `recipientId: string|null` plus `recipientName`/`recipientInitials`
    (damit die DM-Liste den Partnernamen zeigt, auch wenn ich der Absender bin).
  - `formatMessageRow` expandiert `recipient`.
  - `broadcastMessage(msg)` routet: `recipientId == null` → an alle; sonst nur an Streams,
    deren `user.id` ∈ {senderId, recipientId}.
- **`GET /api/chat/stream`** — Snapshot wird `{ general, dms, online }`:
  - `general`: letzte 50 Nachrichten mit `recipient = null`.
  - `dms`: alle Nachrichten, an denen der eingeloggte User beteiligt ist
    (`recipient != null` ∧ (`user=me` ∨ `recipient=me`)), Limit ~200. Client gruppiert.
  - Gäste: `dms = []`.
- **`POST /api/chat/messages`** — Body `{ text, recipientId? }`:
  - eingeloggt erforderlich; `recipientId` (falls gesetzt) muss ein existierender User
    und ≠ Absender sein, sonst 400.
  - speichert mit `recipient`, broadcastet die Nachricht (mit Absender- + Empfänger-Infos).

## Reine Logik (testbar)
- **`app/utils/chatRouting.ts`**: `conversationKeyFor(msg, myId)` → `'general'` oder die
  Partner-ID; `partnerOf(msg, myId)` → `{ id, name, initials }` des Gegenübers.
  Unit-getestet (kein DOM/Netz).

## Frontend
- **`composables/useChat.ts`** (Umbau):
  - State: `general[]`, `dms: Record<partnerId, ChatMessage[]>`, `online[]`,
    `partners: Record<id, {id,name,initials}>`, `activeKey` (`'general'|partnerId`),
    `unread: Record<key, number>`.
  - `conversations` (computed): aus `partners` + `unread` + letzter Nachricht.
  - `setActive(key)` (resetet `unread[key]`), `openConversation(user)` (legt Partner an + aktiviert),
    `send(text, recipientId?)`.
  - Eingehende `message`-Events werden nach `conversationKeyFor` einsortiert; ist die
    Konversation nicht aktiv, `unread[key]++`.
- **`components/ChatThread.vue`** (neu): rendert eine Nachrichtenliste (own/incoming) +
  Eingabezeile; Props `messages`, `disabled`, `placeholder`; Event `send`. Wiederverwendet
  für Allgemein + DM.
- **`components/ChatPanel.vue`** (Umbau): linke Leiste = Navigator
  (Allgemeiner Chat · Direktnachrichten mit Badges · Online → Profil → „Nachricht senden");
  rechts `ChatThread` der aktiven Konversation mit Header (Schloss-Icon bei privat).
  Profil-Vorschau bekommt den „Nachricht senden"-Button (nur fremde Profile, nur eingeloggt).

## Tests & Grenzen
- Unit-Tests für `conversationKeyFor`/`partnerOf` (Absender- und Empfänger-Sicht, Allgemein).
- Runtime-Smoke (Dev-Server): DM senden → landet nur beim Empfänger-Snapshot, nicht im Allgemein.
- Grenze: Presence/Broadcast In-Memory (Single-Prozess), Ungelesen nicht persistent — wie gehabt.

## Out of scope (YAGNI)
- Keine Gruppen-DMs, keine Lesebestätigungen, kein persistenter Unread-Status,
  kein Tippen-Indikator, keine Nachrichten-Löschung/Bearbeitung.

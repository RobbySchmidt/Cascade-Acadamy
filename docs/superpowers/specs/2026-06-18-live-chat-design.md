# Spec: Echter Live-Chat (Presence + SSE + Profil-Vorschau)

> Stand: 2026-06-18. Ersetzt den statischen Chat-Mock durch einen echten, persistenten
> Gruppen-Chat mit echter Online-Presence (via SSE) und einer Profil-Vorschau pro User.

## Ziel & Entscheidungen
- **Ein globaler Chatraum** für alle (kein Kurs-Bezug). Tabs „Alle/Mein Kurs" und die
  Kurs-Tags hinter den Namen entfallen.
- **Nur echte `cascade_users`** – keine Platzhalter. `app/utils/chatMock.ts` wird gelöscht.
- **Echte Presence:** Ein User erscheint in der Online-Liste nur, solange er verbunden ist.
- **Realtime via SSE** (Server-Sent Events vom Nitro-Server). Directus-Token bleibt serverseitig.
- **Gäste lesen nur mit** (Eingabe deaktiviert mit Login-Hinweis), erscheinen nicht als online.
- **Avatare = Initialen** (`avatar_initials`), kein Bild-Upload.

## Datenmodell
- **Neue Collection `cascade_messages`** (in `directus-schema.ps1`):
  `id` (PK), `user` (FK→`cascade_users`), `text` (text), `created_at` (timestamp).
  Relation `cascade_messages.user → cascade_users`.
- **Presence ist nicht persistent** – sie ergibt sich aus den offenen SSE-Verbindungen
  im Nitro-Prozess (kein DB-Feld).

## Backend (Nitro, `server/`)
- **`server/utils/chatHub.ts`** — In-Memory-Singleton im Nitro-Prozess:
  - Registry: Map `streamId → { push, close, user: {id,name,initials} | null }`.
  - `register(entry) → streamId`, `unregister(streamId)`.
  - `broadcastMessage(msg)`, `broadcastPresence()` (sendet die deduplizierte Online-Liste).
  - `onlineUsers()` — eindeutige eingeloggte User mit offener Verbindung.
- **`GET /api/chat/stream`** — SSE (`createEventStream` aus h3):
  1. User aus Session-Cookie bestimmen (`currentUser`); kann `null` sein (Gast).
  2. Snapshot pushen: `snapshot`-Event mit `{ messages: letzte 50, online: [...] }`.
  3. Stream im Hub registrieren (mit User-Info, falls eingeloggt) → `broadcastPresence()`.
  4. Keep-alive-Kommentar alle ~25 s. Bei `onClosed`: `unregister` → `broadcastPresence()`.
- **`POST /api/chat/messages`** — nur eingeloggt (sonst 401):
  Body `{ text }`; trimmen/validieren (1–500 Zeichen); in `cascade_messages` schreiben;
  `broadcastMessage()` mit Autor-Infos.
- **`GET /api/users/[id]`** — Profil-Vorschau-Daten:
  `{ display_name, avatar_initials, started_at, courses: [{ slug, title, status, percent, done, total }] }`.
  `status` = `abgeschlossen` (alle Lektionen des Kurses done) bzw. `begonnen` (mind. 1 done).
  Nur Kurse, in denen der User Fortschritt hat.

## Frontend (`app/`)
- **`composables/useChat.ts`**: öffnet `EventSource('/api/chat/stream')` (client-only),
  hält reaktive `messages` + `online`, Methode `send(text)` (POST). Schließt den Stream
  beim Unmount. Behandelt `snapshot`, `message`, `presence`-Events.
- **`components/ChatPanel.vue`** (Umbau):
  - Linke Spalte: Überschrift „Online" + Liste der Online-User (Klick → Profil-Vorschau).
    Eigener User als „Du" markiert. Keine Tabs, keine Kurs-Tags.
  - **Profil-Vorschau**: Karte im linken Panel (mit „← zurück") – Avatar, Name,
    „lernt seit X Tagen", Kursliste mit Status-Badge + Mini-Progressbar. Lädt via `/api/users/[id]`.
  - Thread rechts: Nachrichten live; eigene Bubbles teal, fremde Inset. „Heute"-Divider bleibt.
  - Eingabe: eingeloggt = aktiv; Gast = deaktiviert + Hinweis. Mentor-Bubble-Variante entfällt.
- **`components/StatTile.vue` / `pages/profil.vue`**: unverändert; `profil.vue` reicht
  weiterhin `meInitials` an `ChatPanel` (für die „Du"-Markierung); `meColor` entfällt.

## Profil-Status-Ableitung (rein, testbar)
Pure Funktion `deriveCourseStatus(progressRows, lessonTotalsByCourse)` →
Liste `{ slug, status, percent, done, total }`. Unit-getestet (kein DOM/Netz).

## Seed / Daten
- **`scripts/directus-seed-progress-demo.ps1`** (idempotent, nicht-destruktiv):
  setzt testuser-1 auf **CSS-Grundlagen 15/15 (abgeschlossen)** und **Flexbox 3/15 (begonnen)**,
  damit die Profil-Vorschau echte Daten zeigt. (Bestehende Progress-Zeilen werden vorher
  für diese beiden Kurse/User bereinigt → wiederholbar.)
- `directus-schema.ps1` um `cascade_messages` + Relation erweitern (idempotent).

## Tests & Grenzen
- Unit-Test für `deriveCourseStatus` (begonnen/abgeschlossen/Prozent, Rundung).
- **Grenze:** Presence + Broadcast leben im Prozessspeicher → nur Single-Prozess-Deployment
  (`node .output/server/index.mjs`, `yarn dev`). Über mehrere Instanzen bräuchte es einen
  geteilten Pub/Sub (z. B. Directus-Realtime/Redis) — bewusst out of scope.
- SSE/Hub werden nicht headless unit-getestet (Prozess-/Verbindungslogik) → manueller Test:
  in zwei Browsern als testuser-1 und testuser-2 einloggen.

## Out of scope (YAGNI)
- Keine Privatnachrichten, keine Räume/Kanäle, keine Mentor-Rolle, kein Tippen-Indikator.
- Kein Avatar-Bild-Upload (nur Initialen).
- Keine Nachrichten-Moderation/Löschung im UI.

# Cascade Academy — DM-Benachrichtigungen (Badge + Toast)

> **Stand:** 2026-06-18
> **Status:** Design abgestimmt, bereit für Implementierungsplan.

## 1. Problem

Die SSE-Chat-Verbindung wird heute **nur auf der Profil-Seite** geöffnet
(`app/pages/profil.vue` montiert `ChatPanel`, das `useChat()` aufruft). Auf
Kurs- und Lektionsseiten ist **keine Verbindung offen** — eingehende
Direktnachrichten werden dort weder empfangen noch angezeigt. Wer gerade lernt,
verpasst private Nachrichten komplett.

## 2. Ziel

Während die App offen ist, bekommt ein:e eingeloggte:r Nutzer:in **auf jeder
Seite** mit, dass eine **private Nachricht** angekommen ist:

1. ein **Zähler-Badge** am „Profil"-Eintrag in der Navigation, und
2. ein **kurzer, klickbarer Toast**, der direkt in die betreffende DM springt.

Der Allgemein-Chat ist hier **bewusst ausgenommen** — nur DMs.

## 3. Gewählter Ansatz

**Geteilter Chat-State + eine app-weite SSE-Verbindung.** `useChat()` wird zum
Singleton: der State liegt in `useState`, und pro Browser-Tab existiert genau
**eine** EventSource, die über Seitenwechsel hinweg offen bleibt. Navigation,
`ChatPanel` und der Toast lesen denselben Zustand.

**Verworfene Alternative — Polling:** AppNav fragt periodisch einen
Unread-Endpoint ab. Bräuchte serverseitiges Ungelesen-Tracking (existiert nicht,
„unread" ist heute rein clientseitig), wäre nicht echtzeitfähig und mehr
Aufwand. Verworfen.

## 4. Architektur

### 4.1 `useChat()` → Singleton

Heute legt **jeder** `useChat()`-Aufruf eigene Refs **und** eine eigene
EventSource an. Künftig:

- State (`general`, `rawDms`, `online`, `unread`, `activeKey`,
  `openedPartners`, `connected`, neu: `toasts`) liegt in **`useState`** mit
  stabilen Keys → über alle Aufrufer hinweg geteilt.
- Die EventSource ist ein **Modul-Singleton**. `connect()` bleibt idempotent
  (`if (es) return`), `disconnect()` schließt sie und setzt sie auf `null`.
- `onMounted(connect)` / `onBeforeUnmount(disconnect)` werden **aus dem
  Composable entfernt** (siehe 4.2) — sonst würde jeder Konsument die
  Verbindung schließen, sobald seine Komponente unmountet.

Die öffentliche Rückgabe von `useChat()` bleibt abwärtskompatibel; `ChatPanel`
funktioniert unverändert weiter und bekommt zusätzlich Zugriff auf den
geteilten State.

### 4.2 App-weite Verbindungs-Lebensdauer

- `connect()` wird im **default-Layout** (`app/layouts/default.vue`) in
  `onMounted` aufgerufen. Das Layout bleibt über Seitenwechsel innerhalb der
  authentifizierten App montiert → die Verbindung persistiert.
- Der Login nutzt das **`blank`-Layout** → dort wird keine Verbindung geöffnet.
- Beim Logout (Wechsel zu `blank`, default-Layout unmountet) läuft
  `onBeforeUnmount(disconnect)` → sauberes Schließen.
- Gäste verbinden sich wie bisher (lesen Allgemein-Chat read-only); der
  Stream-Endpoint behandelt `userId = null` bereits korrekt und zählt Gäste
  nicht zur Presence.

**Verhaltensänderung (abgestimmt):** Eingeloggte Nutzer:innen erscheinen
**„online", solange die App geöffnet ist** — nicht mehr nur auf der Chat-Seite.
Dies wird als korrekteres Presence-Verhalten akzeptiert.

### 4.3 DM-Unread-Badge in der Navigation

- Neuer Computed in `useChat()`: **`dmUnread`** = Summe von `unread[key]` über
  alle DM-Konversations-Keys (der Key `general` wird **ausgeschlossen**).
- `app/components/AppNav.vue` ruft `useChat()` auf und zeigt am „Profil"-Link
  ein Teal-Zähler-Badge, wenn `dmUnread > 0`. Stil analog zu den vorhandenen
  Badges in `ChatPanel.vue` (`rounded-full bg-teal-600 text-on-teal`,
  `min-width: 18px`, `font-size: 11px`).
- **Reset:** automatisch über den bestehenden Mechanismus — `setActive(key)`
  nullt `unread[key]`, sobald die DM geöffnet wird. Kein zusätzlicher
  Reset-Code nötig.
- Badge nur für eingeloggte Nutzer:innen (Gäste haben keine DMs).

### 4.4 Klickbarer Toast (global)

- **Auslöser:** im `message`-Event-Handler von `useChat()`. Eine eingehende
  Nachricht erzeugt einen Toast genau dann, wenn `shouldNotifyDm(...)` (siehe
  4.5) `true` liefert: es ist eine DM **an mich**, **nicht von mir selbst**, und
  ich habe die Konversation gerade **nicht aktiv offen**.
- **Datenmodell:** geteilter `toasts`-Ref (Queue) in `useState`. Jeder Eintrag:
  `{ id, partnerKey, partnerName, partnerInitials, text }`. Eine Funktion
  `pushToast(entry)` hängt an, `dismissToast(id)` entfernt. IDs werden aus einem
  modul-lokalen, monoton steigenden Zähler erzeugt (kein `Date.now()` nötig).
- **Komponente:** neue `app/components/ChatToast.vue`, gerendert **einmal** im
  default-Layout (fixed, oben rechts, gestapelt). Zeigt
  „**Neue Nachricht von {partnerName}**" + Textvorschau (gekürzt). Auto-Dismiss
  nach ~5 s via `setTimeout` (im `blank`-Layout nie gemountet → kein Login-Toast).
- **Klick:** `router.push('/profil')` → dann `openConversation({id, name,
  initials})` bzw. `setActive(partnerKey)`, springt direkt in die DM; Toast wird
  geschlossen.
- **Scope:** nur DMs. Kein Toast für den Allgemein-Chat.

### 4.5 Reine Logik (testbar)

- Neue Datei `app/utils/chatNotify.ts` mit
  `shouldNotifyDm(msg, myId, activeKey): boolean`:
  - `true`, wenn `msg.recipientId` gesetzt ist (DM), `msg.userId !== myId`
    (nicht von mir), und der aus `msg` abgeleitete Konversations-Key
    (`conversationKeyFor`, wiederverwendet aus `chatRouting.ts`)
    **ungleich** `activeKey` ist.
  - sonst `false`.
- `dmUnread` ist ein trivialer Computed (Summe ohne `general`).

## 5. Datenfluss

```
SSE 'message' (DM an mich, andere Konversation aktiv)
   └─► useChat message-Handler
        ├─ rawDms += msg            (DM-Liste/Konversationen aktualisieren)
        ├─ bump(key)                (unread[key]++  →  dmUnread steigt  →  AppNav-Badge)
        └─ shouldNotifyDm(...) === true
             └─► pushToast(entry)   →  ChatToast (oben rechts)
                                        └─ Klick → /profil + setActive(key)
```

## 6. Betroffene Dateien

| Datei | Änderung |
|---|---|
| `app/composables/useChat.ts` | State → `useState`-Singleton; EventSource Modul-Singleton; `onMounted/onBeforeUnmount` entfernt; `dmUnread`, `toasts`, `pushToast`, `dismissToast` ergänzt; Toast-Trigger im `message`-Handler |
| `app/utils/chatNotify.ts` | **neu** — reine `shouldNotifyDm(...)` |
| `app/layouts/default.vue` | `connect()`/`disconnect()`-Lebenszyklus; `<ChatToast />` rendern |
| `app/components/AppNav.vue` | `useChat()`; DM-Badge am Profil-Link |
| `app/components/ChatToast.vue` | **neu** — gestapelte, klickbare Toasts mit Auto-Dismiss |
| `app/components/ChatPanel.vue` | keine funktionale Änderung; nutzt den jetzt geteilten State weiter |
| `test/chatNotify.test.ts` | **neu** — Unit-Tests für `shouldNotifyDm` |

## 7. Tests

- **`shouldNotifyDm`** (neu): DM an mich + andere Konversation aktiv → `true`;
  DM an mich + diese Konversation aktiv → `false`; eigene DM (Absender = ich) →
  `false`; Allgemein-Nachricht (`recipientId = null`) → `false`.
- Bestehende Suite (`chatRouting`, `session`, `checker`, `profileStatus`) muss
  grün bleiben.
- `yarn build` muss grün bleiben.

## 8. Bewusst nicht im Scope (YAGNI)

- Keine Browser-/OS-Notifications und kein Sound.
- Kein Toast/Badge für den Allgemein-Chat.
- Keine persistente Ungelesen-Speicherung — bleibt clientseitig, Reset bei
  Reload (wie heute).
- Kein serverseitiges Unread-Tracking, kein Multi-Instanz-Pub/Sub (Presence
  bleibt In-Memory, Single-Prozess — wie heute).

## 9. Manueller Smoke-Test (vor Release)

In zwei Browsern als `testuser-1` und `testuser-2` (beide `test1234`) einloggen:

1. Browser A auf einer **Kursseite** (nicht Profil).
2. Browser B schickt A eine **DM**.
3. In Browser A erscheint **Toast** (oben rechts) **und** Badge am Profil-Icon.
4. Klick auf den Toast → landet **direkt in der DM** auf der Profil-Seite, Badge
   für diese Konversation verschwindet.
5. Allgemein-Chat-Nachricht von B löst in A **keinen** Toast/DM-Badge aus.

// In-memory chat hub: a process-wide singleton that tracks open SSE streams and
// broadcasts messages + presence. Presence is purely live (derived from open
// streams), messages persist in Directus. Works for the single-process Node
// deployment (`node .output/server/index.mjs`); multi-instance would need a
// shared pub/sub — deliberately out of scope.

export interface ChatUserInfo {
  id: string
  name: string
  initials: string
}

export interface ChatMessage {
  id: string | number
  userId: string
  name: string
  initials: string
  text: string
  created_at: string
  // null = general chat; set = direct message to that user.
  recipientId: string | null
  recipientName: string | null
  recipientInitials: string | null
}

type PushFn = (event: string, data: unknown) => void

interface StreamEntry {
  id: number
  push: PushFn
  user: ChatUserInfo | null // null = guest (read-only, not counted online)
}

const streams = new Map<number, StreamEntry>()
let nextId = 1

export function registerStream(push: PushFn, user: ChatUserInfo | null): number {
  const id = nextId++
  streams.set(id, { id, push, user })
  return id
}

export function unregisterStream(id: number): void {
  streams.delete(id)
}

/** Distinct logged-in users with at least one open stream. */
export function onlineUsers(): ChatUserInfo[] {
  const byId = new Map<string, ChatUserInfo>()
  for (const s of streams.values()) {
    if (s.user) byId.set(s.user.id, s.user)
  }
  return [...byId.values()]
}

export function broadcast(event: string, data: unknown): void {
  for (const s of streams.values()) {
    try { s.push(event, data) } catch { /* dead stream; cleaned up on close */ }
  }
}

export function broadcastPresence(): void {
  broadcast('presence', { online: onlineUsers() })
}

/**
 * Deliver a message: general (recipientId null) goes to everyone; a DM goes only
 * to the sender's and recipient's open streams.
 */
export function broadcastMessage(msg: ChatMessage): void {
  if (!msg.recipientId) {
    broadcast('message', msg)
    return
  }
  for (const s of streams.values()) {
    if (s.user && (s.user.id === msg.userId || s.user.id === msg.recipientId)) {
      try { s.push('message', msg) } catch { /* dead stream */ }
    }
  }
}

/** Normalize a Directus cascade_messages row (with expanded user + recipient). */
export function formatMessageRow(m: any): ChatMessage {
  const u = (m && typeof m.user === 'object' && m.user) ? m.user : null
  const r = (m && typeof m.recipient === 'object' && m.recipient) ? m.recipient : null
  const recipientId = r ? String(r.id) : (m?.recipient != null ? String(m.recipient) : null)
  return {
    id: m.id,
    userId: u ? String(u.id) : String(m?.user ?? ''),
    name: u?.display_name ?? 'Unbekannt',
    initials: u?.avatar_initials ?? '??',
    text: m?.text ?? '',
    created_at: m?.created_at ?? '',
    recipientId,
    recipientName: r?.display_name ?? null,
    recipientInitials: r?.avatar_initials ?? null,
  }
}

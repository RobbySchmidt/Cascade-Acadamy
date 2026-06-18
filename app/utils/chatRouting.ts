// Pure helpers for sorting chat messages into conversations, from the current
// user's perspective. No DOM / no network — unit-tested in isolation.

export interface RoutableMessage {
  userId: string
  name: string
  initials: string
  recipientId: string | null
  recipientName: string | null
  recipientInitials: string | null
}

export interface Partner {
  id: string
  name: string
  initials: string
}

/** Conversation a message belongs to: 'general' or the other party's id. */
export function conversationKeyFor(msg: RoutableMessage, myId: string): string {
  if (!msg.recipientId) return 'general'
  return msg.userId === myId ? msg.recipientId : msg.userId
}

/** The other participant of a DM, from myId's perspective. Null for general. */
export function partnerOf(msg: RoutableMessage, myId: string): Partner | null {
  if (!msg.recipientId) return null
  if (msg.userId === myId) {
    return { id: msg.recipientId, name: msg.recipientName ?? 'Unbekannt', initials: msg.recipientInitials ?? '??' }
  }
  return { id: msg.userId, name: msg.name, initials: msg.initials }
}

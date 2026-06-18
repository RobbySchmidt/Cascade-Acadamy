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
  const chatVisible = useState<boolean>('chat:visible', () => false) // is the chat panel on screen?

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

  // The conversation the user is actually looking at, or '' when the chat panel
  // isn't on screen — so DMs on other pages always badge + toast, even for the
  // conversation that happens to be `activeKey`.
  const viewedKey = computed(() => (chatVisible.value ? activeKey.value : ''))

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

  // Called by the chat panel as it mounts/unmounts, so notifications are only
  // suppressed for the conversation that is genuinely on screen.
  function openPanel() {
    chatVisible.value = true
    unread.value = { ...unread.value, [activeKey.value]: 0 } // what's shown on open is read
  }

  function closePanel() {
    chatVisible.value = false
  }

  function bump(key: string) {
    if (key === viewedKey.value) return
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
      openedPartners.value = [] // reset on (re)connect; avoids a prior session's partner leaking in
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
        if (shouldNotifyDm(m, myId.value, viewedKey.value)) {
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

  async function send(text: string) {
    const t = text.trim()
    if (!t) return
    const recipientId = activeKey.value === 'general' ? undefined : activeKey.value
    await $fetch('/api/chat/messages', { method: 'POST', body: { text: t, recipientId } })
    // Echo arrives via SSE broadcast — no optimistic append.
  }

  return {
    general, dms, online, conversations, online_count: computed(() => online.value.length),
    activeKey, generalUnread, dmUnread, connected, toasts,
    messagesFor, setActive, openConversation, send,
    connect, disconnect, pushToast, dismissToast,
    openPanel, closePanel,
  }
}

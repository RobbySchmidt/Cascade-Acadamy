import { conversationKeyFor, partnerOf, type Partner } from '~/utils/chatRouting'

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

/**
 * Live chat over SSE with a general room + 1:1 direct messages.
 * Raw message lists are kept flat and bucketed into conversations via computeds,
 * so routing stays correct even if the current user's id resolves after the
 * initial snapshot.
 */
export function useChat() {
  const { user } = useAuth()
  const myId = computed(() => (user.value ? String(user.value.id) : ''))

  const general = ref<ChatMessage[]>([])
  const rawDms = ref<ChatMessage[]>([])
  const online = ref<OnlineUser[]>([])
  const openedPartners = ref<Partner[]>([]) // DMs opened from a profile, maybe empty
  const activeKey = ref<string>('general')
  const unread = ref<Record<string, number>>({})
  const connected = ref(false)

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

  // ----- SSE -----
  let es: EventSource | null = null

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
    })

    es.addEventListener('message', (e) => {
      const m = JSON.parse((e as MessageEvent).data) as ChatMessage
      if (!m.recipientId) {
        general.value = [...general.value, m]
        bump('general')
      } else {
        rawDms.value = [...rawDms.value, m]
        bump(conversationKeyFor(m, myId.value))
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

  onMounted(connect)
  onBeforeUnmount(disconnect)

  return {
    general, dms, online, conversations, online_count: computed(() => online.value.length),
    activeKey, generalUnread, connected,
    messagesFor, setActive, openConversation, send,
  }
}

// SSE endpoint: streams chat messages + presence to the browser.
// The session cookie is sent same-origin, so we can identify the user (or null
// for guests, who may read but are not counted as online).

export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)
  const api = directus(event)

  // Resolve the connecting user's display info (logged-in only).
  let userInfo: ChatUserInfo | null = null
  if (userId) {
    try {
      const u = await api<{ data: any }>(`/items/cascade_users/${userId}`, {
        params: { fields: 'id,display_name,avatar_initials' },
      })
      if (u.data) {
        userInfo = {
          id: String(u.data.id),
          name: u.data.display_name ?? 'Du',
          initials: u.data.avatar_initials ?? '??',
        }
      }
    } catch { /* fall through as guest-like */ }
  }

  const msgFields = 'id,text,created_at,user.id,user.display_name,user.avatar_initials,recipient.id,recipient.display_name,recipient.avatar_initials'

  // General history (recipient = null), oldest → newest.
  let general: ChatMessage[] = []
  try {
    const res = await api<{ data: any[] }>('/items/cascade_messages', {
      params: {
        filter: JSON.stringify({ recipient: { _null: true } }),
        fields: msgFields,
        sort: '-created_at',
        limit: 50,
      },
    })
    general = (res.data ?? []).reverse().map(formatMessageRow)
  } catch { /* empty general history on error */ }

  // Direct messages the logged-in user is part of (sender or recipient).
  let dms: ChatMessage[] = []
  if (userId) {
    try {
      const res = await api<{ data: any[] }>('/items/cascade_messages', {
        params: {
          filter: JSON.stringify({
            recipient: { _nnull: true },
            _or: [{ user: { _eq: userId } }, { recipient: { _eq: userId } }],
          }),
          fields: msgFields,
          sort: '-created_at',
          limit: 200,
        },
      })
      dms = (res.data ?? []).reverse().map(formatMessageRow)
    } catch { /* empty dm history on error */ }
  }

  const stream = createEventStream(event)
  const push = (name: string, data: unknown) => {
    stream.push({ event: name, data: JSON.stringify(data) }).catch(() => {})
  }

  const streamId = registerStream(push, userInfo)

  // Initial snapshot to this client, then tell everyone the presence changed.
  push('snapshot', { general, dms, online: onlineUsers() })
  broadcastPresence()

  // Keep-alive so proxies don't drop the idle connection (client ignores 'ping').
  const keepAlive = setInterval(() => push('ping', Date.now()), 25000)

  stream.onClosed(() => {
    clearInterval(keepAlive)
    unregisterStream(streamId)
    broadcastPresence()
  })

  return stream.send()
})

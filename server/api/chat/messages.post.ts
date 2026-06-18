// Send a chat message — general (no recipient) or a direct message (recipientId).
// Logged-in users only (guests read-only). Persists to Directus and broadcasts:
// general → everyone, DM → sender + recipient only.

export default defineEventHandler(async (event) => {
  const userId = currentUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Zum Schreiben bitte anmelden.' })
  }

  const body = await readBody(event)
  const text = String(body?.text ?? '').trim()
  if (!text) throw createError({ statusCode: 400, statusMessage: 'Leere Nachricht.' })
  if (text.length > 500) throw createError({ statusCode: 400, statusMessage: 'Nachricht zu lang (max. 500 Zeichen).' })

  const recipientId = body?.recipientId != null ? String(body.recipientId) : null
  if (recipientId === String(userId)) {
    throw createError({ statusCode: 400, statusMessage: 'Du kannst dir nicht selbst schreiben.' })
  }

  const api = directus(event)

  // Author info for the broadcast payload.
  const author = (await api<{ data: any }>(`/items/cascade_users/${userId}`, {
    params: { fields: 'id,display_name,avatar_initials' },
  })).data

  // Validate + resolve recipient for DMs.
  let recipient: any = null
  if (recipientId) {
    try {
      recipient = (await api<{ data: any }>(`/items/cascade_users/${recipientId}`, {
        params: { fields: 'id,display_name,avatar_initials' },
      })).data
    } catch { recipient = null }
    if (!recipient) throw createError({ statusCode: 400, statusMessage: 'Empfänger nicht gefunden.' })
  }

  const created_at = new Date().toISOString()
  const res = await api<{ data: any }>('/items/cascade_messages', {
    method: 'POST',
    body: { user: userId, recipient: recipientId, text, created_at },
  })

  broadcastMessage({
    id: res.data?.id,
    userId: String(userId),
    name: author?.display_name ?? 'Unbekannt',
    initials: author?.avatar_initials ?? '??',
    text,
    created_at,
    recipientId,
    recipientName: recipient?.display_name ?? null,
    recipientInitials: recipient?.avatar_initials ?? null,
  })

  return { ok: true }
})

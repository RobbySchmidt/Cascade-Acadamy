export default defineEventHandler(async (event) => {
  const id = currentUserId(event)
  if (!id) return { user: null }
  const api = directus(event)
  try {
    const res = await api<{ data: any }>(`/items/cascade_users/${id}`, {
      params: { fields: 'id,display_name,avatar_initials,streak,started_at' },
    })
    const u = res.data
    if (!u) return { user: null }
    return {
      user: {
        id: u.id,
        display_name: u.display_name,
        avatar_initials: u.avatar_initials,
        streak: u.streak,
        started_at: u.started_at,
      },
    }
  } catch {
    return { user: null }
  }
})

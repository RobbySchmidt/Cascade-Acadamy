export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const { identifier, password } = await readBody(event)
  const api = directus(event)
  const res = await api<{ data: any[] }>('/items/cascade_users', {
    params: {
      filter: JSON.stringify({
        _or: [{ username: { _eq: identifier } }, { email: { _eq: identifier } }],
      }),
      fields: 'id,display_name,avatar_initials,password',
      limit: 1,
    },
  })
  const user = res.data?.[0]
  if (!user || user.password !== password) {
    throw createError({ statusCode: 401, statusMessage: 'Falsche Zugangsdaten' })
  }
  setCookie(event, 'cascade_session', signSession(String(user.id), cfg.sessionSecret as string), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return { id: user.id, display_name: user.display_name, avatar_initials: user.avatar_initials }
})

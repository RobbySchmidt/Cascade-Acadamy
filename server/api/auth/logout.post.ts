export default defineEventHandler((event) => {
  deleteCookie(event, 'cascade_session')
  return { ok: true }
})

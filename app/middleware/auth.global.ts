export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return
  const { user, isGuest, fetchMe } = useAuth()
  if (!user.value && !isGuest.value) {
    await fetchMe()
  }
  if (!user.value && !isGuest.value) {
    return navigateTo('/login')
  }
})

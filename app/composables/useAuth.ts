export interface AuthUser {
  id: string | number
  display_name: string
  avatar_initials: string
  streak?: number
  started_at?: string
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const guestCookie = useCookie<string | null>('cascade_guest')

  const isGuest = computed(() => String(guestCookie.value) === '1' && !user.value)

  async function fetchMe() {
    const fetchWithCookies = useRequestFetch()
    const res = await fetchWithCookies('/api/me') as { user: AuthUser | null }
    user.value = res.user
    return user.value
  }

  async function login(identifier: string, password: string) {
    const res = await $fetch<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: { identifier, password },
    })
    user.value = res
    guestCookie.value = null
    return res
  }

  function loginAsGuest() {
    guestCookie.value = '1'
    user.value = null
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    guestCookie.value = null
  }

  return { user, isGuest, fetchMe, login, loginAsGuest, logout }
}

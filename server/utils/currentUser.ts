export function currentUserId(event: any): string | null {
  const cfg = useRuntimeConfig(event)
  return verifySession(getCookie(event, 'cascade_session'), cfg.sessionSecret as string)
}

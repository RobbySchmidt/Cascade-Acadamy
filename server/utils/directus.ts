export function directus(event: any) {
  const cfg = useRuntimeConfig(event)
  return $fetch.create({
    baseURL: cfg.directusUrl as string,
    headers: { Authorization: `Bearer ${cfg.directusToken}` },
  })
}

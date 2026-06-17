const STORAGE_KEY = 'cascade_guest_progress'

function read(): number[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((n): n is number => typeof n === 'number')
    return []
  } catch {
    return []
  }
}

function write(ids: number[]): void {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ignore (private mode / quota)
  }
}

export function useGuestProgress() {
  function doneIds(): number[] {
    return read()
  }

  function isDone(id: number): boolean {
    return read().includes(id)
  }

  function markDone(id: number): void {
    const ids = read()
    if (!ids.includes(id)) {
      ids.push(id)
      write(ids)
    }
  }

  return { isDone, markDone, doneIds }
}

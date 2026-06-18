<script setup lang="ts">
import { MessageCircle, X } from 'lucide-vue-next'
import type { ChatToastEntry } from '~/composables/useChat'

const chat = useChat()
const { toasts } = chat
const router = useRouter()

// Each toast auto-dismisses ~5s after it appears.
const timers = new Map<number, ReturnType<typeof setTimeout>>()

watch(
  toasts,
  (list) => {
    const live = new Set(list.map((t) => t.id))
    // Start a timer for each newly arrived toast.
    for (const t of list) {
      if (!timers.has(t.id)) {
        timers.set(t.id, setTimeout(() => dismiss(t.id), 5000))
      }
    }
    // Drop timers for toasts already gone (e.g. snapshot reset on reconnect).
    for (const [id, handle] of timers) {
      if (!live.has(id)) {
        clearTimeout(handle)
        timers.delete(id)
      }
    }
  },
  { immediate: true },
)

function dismiss(id: number) {
  const handle = timers.get(id)
  if (handle) {
    clearTimeout(handle)
    timers.delete(id)
  }
  chat.dismissToast(id)
}

function open(t: ChatToastEntry) {
  dismiss(t.id)
  chat.openConversation({ id: t.partnerKey, name: t.partnerName, initials: t.partnerInitials })
  void router.push('/profil')
}

onBeforeUnmount(() => {
  for (const h of timers.values()) clearTimeout(h)
  timers.clear()
})
</script>

<template>
  <div class="pointer-events-none fixed z-50 flex flex-col" style="top: 78px; right: 24px; gap: 10px; width: 320px; max-width: calc(100vw - 48px)">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto relative flex w-full items-start border border-border bg-surface shadow-card"
        style="border-radius: 14px; gap: 11px; padding: 13px 14px"
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-start gap-[11px] text-left transition-colors"
          @click="open(t)"
        >
          <span
            class="flex shrink-0 items-center justify-center rounded-full font-semibold"
            style="width: 34px; height: 34px; background: rgba(18,181,165,0.13); color: #3FD9C9; font-size: 12px"
          >{{ t.partnerInitials }}</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-[6px] font-display font-bold text-text" style="font-size: 14px">
              <MessageCircle :size="14" class="shrink-0 text-teal-700" />
              Neue Nachricht von {{ t.partnerName }}
            </span>
            <span class="mt-[2px] block truncate font-medium text-text-faint" style="font-size: 12.5px">{{ t.text }}</span>
          </span>
        </button>
        <button
          type="button"
          class="shrink-0 self-start text-text-faint transition-colors hover:text-text"
          aria-label="Benachrichtigung schließen"
          @click="dismiss(t.id)"
        ><X :size="15" /></button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>

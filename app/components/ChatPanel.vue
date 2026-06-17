<script setup lang="ts">
import { onlineAll, onlineCourse, messages as mockMessages } from '~/utils/chatMock'
import type { ChatUser, ChatMessage } from '~/utils/chatMock'

const props = withDefaults(defineProps<{
  meInitials: string
  meColor?: string
}>(), {
  meColor: '#0E7A70',
})

const filter = ref<'all' | 'course'>('all')

// "Du" row prepended in the "Mein Kurs" list using the real current user.
const meRow = computed<ChatUser>(() => ({
  id: 'me',
  name: 'Du',
  initials: props.meInitials || 'MK',
  color: props.meColor,
  courseTag: 'ich',
  isMe: true,
}))

const visibleUsers = computed<ChatUser[]>(() =>
  filter.value === 'all' ? onlineAll : [meRow.value, ...onlineCourse],
)

// Local, optimistic copy of the thread — sending only appends here.
const thread = reactive<ChatMessage[]>(mockMessages.map(m => ({ ...m })))
const draft = ref('')
const threadEl = ref<HTMLElement | null>(null)

function send() {
  const text = draft.value.trim()
  if (!text) return
  thread.push({
    id: 'local-' + Date.now(),
    author: 'Du',
    initials: props.meInitials || 'MK',
    color: props.meColor,
    kind: 'own',
    text,
  })
  draft.value = ''
  nextTick(() => {
    if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight
  })
}
</script>

<template>
  <div class="flex overflow-hidden bg-surface shadow-card" style="border-radius: 18px; border: 1px solid var(--border, #DCEBE7); min-height: 360px">
    <!-- LEFT RAIL -->
    <aside class="shrink-0 border-r border-border p-[16px]" style="width: 262px">
      <!-- segmented filter -->
      <div class="flex items-center" style="gap: 6px">
        <button
          type="button"
          class="rounded-pill font-semibold transition-colors"
          :class="filter === 'all' ? 'bg-teal-700 text-white' : 'bg-transparent text-text-muted'"
          style="padding: 7px 14px; font-size: 13px"
          @click="filter = 'all'"
        >Alle · 14</button>
        <button
          type="button"
          class="rounded-pill font-semibold transition-colors"
          :class="filter === 'course' ? 'bg-teal-700 text-white' : 'bg-transparent text-text-muted'"
          style="padding: 7px 14px; font-size: 13px"
          @click="filter = 'course'"
        >Mein Kurs · 5</button>
      </div>

      <!-- course context label -->
      <div v-if="filter === 'course'" class="mt-[14px] font-medium text-text-faint" style="font-size: 12.5px">
        In „CSS-Grundlagen“
      </div>

      <!-- online users -->
      <ul class="mt-[10px] flex flex-col" style="gap: 2px">
        <li
          v-for="u in visibleUsers"
          :key="u.id"
          class="flex items-center rounded-[10px]"
          :class="u.isMe ? 'bg-teal-soft' : ''"
          style="gap: 10px; padding: 7px 8px"
        >
          <span
            class="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
            :style="{ width: '30px', height: '30px', background: u.color, fontSize: '11.5px' }"
          >{{ u.initials }}</span>

          <span class="min-w-0 flex-1 truncate font-semibold" :class="u.isMe ? 'text-teal-700' : 'text-text'" style="font-size: 14px">
            {{ u.name }}
            <span
              v-if="u.mentor"
              class="ml-[6px] inline-block rounded-pill align-middle font-semibold"
              style="background: #FCEAE0; color: #C2410C; padding: 2px 8px; font-size: 11px"
            >Mentor</span>
          </span>

          <span
            v-if="!u.mentor"
            class="shrink-0 font-medium"
            :class="u.isMe ? 'text-teal-700' : 'text-text-faint'"
            style="font-size: 12px"
          >{{ u.courseTag }}</span>
        </li>
      </ul>
    </aside>

    <!-- THREAD -->
    <div class="flex flex-1 flex-col" style="min-width: 0">
      <div ref="threadEl" class="flex flex-1 flex-col overflow-y-auto" style="gap: 12px; padding: 20px 24px">
        <!-- date divider -->
        <div class="flex justify-center">
          <span class="rounded-pill bg-bg font-medium text-text-faint" style="padding: 4px 14px; font-size: 12px">Heute</span>
        </div>

        <template v-for="m in thread" :key="m.id">
          <!-- own (right) -->
          <div v-if="m.kind === 'own'" class="flex flex-col items-end" style="gap: 4px">
            <span class="font-medium text-text-faint" style="font-size: 12px">Du</span>
            <div
              class="font-medium text-white"
              :class="m.code ? 'font-mono' : ''"
              style="background: #12B5A5; border-radius: 13px 13px 4px 13px; padding: 10px 14px; font-size: 14.5px; max-width: 78%"
            >{{ m.text }}</div>
          </div>

          <!-- incoming + mentor (left) -->
          <div v-else class="flex flex-col items-start" style="gap: 4px">
            <span
              class="font-medium"
              :class="m.kind === 'mentor' ? 'font-semibold' : 'text-text-muted'"
              :style="m.kind === 'mentor' ? 'color:#C2410C; font-size:12px' : 'font-size:12px'"
            >{{ m.author }}</span>
            <div
              :class="m.code ? 'font-mono' : 'font-medium'"
              :style="m.kind === 'mentor'
                ? 'background:#FCEFE7; border:1px solid #F6DDCB; color:#1F2A28; border-radius:13px 13px 13px 4px; padding:10px 14px; font-size:14.5px; max-width:78%'
                : 'background:#F1F6F5; color:#1F2A28; border-radius:13px 13px 13px 4px; padding:10px 14px; font-size:14.5px; max-width:78%'"
            >{{ m.text }}</div>
          </div>
        </template>
      </div>

      <!-- input row -->
      <div class="flex items-center border-t border-border" style="gap: 10px; padding: 14px 16px">
        <input
          v-model="draft"
          type="text"
          placeholder="Nachricht schreiben…"
          class="flex-1 rounded-[11px] border border-border font-medium text-text outline-none focus:border-teal-600"
          style="background: #FBFDFC; padding: 11px 14px; font-size: 14.5px"
          @keydown.enter.prevent="send"
        >
        <button
          type="button"
          aria-label="Senden"
          class="flex shrink-0 items-center justify-center rounded-full text-white transition-colors hover:opacity-90"
          style="width: 42px; height: 42px; background: #12B5A5; font-size: 17px"
          @click="send"
        >➤</button>
      </div>
    </div>
  </div>
</template>

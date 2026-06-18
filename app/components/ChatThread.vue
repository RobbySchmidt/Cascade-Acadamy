<script setup lang="ts">
import { Send } from 'lucide-vue-next'
import type { ChatMessage } from '~/composables/useChat'

const props = withDefaults(defineProps<{
  messages: ChatMessage[]
  myId: string
  disabled?: boolean
  placeholder?: string
  /** Identifies the active conversation; switching it scrolls to the bottom. */
  conversationKey?: string
}>(), {
  disabled: false,
  placeholder: 'Nachricht schreiben …',
  conversationKey: '',
})

const emit = defineEmits<{ send: [text: string] }>()

const draft = ref('')
const sending = ref(false)
const threadEl = ref<HTMLElement | null>(null)

async function onSend() {
  const text = draft.value.trim()
  if (!text || sending.value || props.disabled) return
  sending.value = true
  try {
    emit('send', text)
    draft.value = ''
  } finally {
    sending.value = false
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight
  })
}

watch(() => props.messages.length, scrollToBottom)
watch(() => props.conversationKey, scrollToBottom)
onMounted(scrollToBottom)
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col" style="min-width: 0">
    <div ref="threadEl" class="flex min-h-0 flex-1 flex-col overflow-y-auto" style="gap: 12px; padding: 20px 24px">
      <div v-if="!messages.length" class="m-auto text-center font-medium text-text-faint" style="font-size: 13px">
        Noch keine Nachrichten.<br>Schreib die erste!
      </div>

      <template v-for="m in messages" :key="m.id">
        <!-- own (right) -->
        <div v-if="m.userId === myId" class="flex flex-col items-end" style="gap: 4px">
          <span class="font-medium text-text-faint" style="font-size: 12px">Du</span>
          <div
            class="font-medium text-on-teal"
            style="background: #12B5A5; border-radius: 13px 13px 4px 13px; padding: 10px 14px; font-size: 14.5px; max-width: 78%"
          >{{ m.text }}</div>
        </div>

        <!-- incoming (left) -->
        <div v-else class="flex flex-col items-start" style="gap: 4px">
          <span class="font-medium text-text-muted" style="font-size: 12px">{{ m.name }}</span>
          <div
            class="font-medium text-text-body"
            style="background: rgba(255,255,255,0.06); border-radius: 13px 13px 13px 4px; padding: 10px 14px; font-size: 14.5px; max-width: 78%"
          >{{ m.text }}</div>
        </div>
      </template>
    </div>

    <!-- input row -->
    <div class="flex items-center border-t border-border" style="gap: 10px; padding: 14px 16px">
      <input
        v-model="draft"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled || sending"
        class="flex-1 rounded-[11px] border border-border font-medium text-text placeholder:text-text-faint outline-none focus:border-teal-600 disabled:opacity-60"
        style="background: rgba(255,255,255,0.04); padding: 11px 14px; font-size: 14.5px"
        @keydown.enter.prevent="onSend"
      >
      <button
        type="button"
        aria-label="Senden"
        :disabled="disabled || sending"
        class="flex shrink-0 items-center justify-center rounded-full text-on-teal transition-colors hover:opacity-90 disabled:opacity-50"
        style="width: 42px; height: 42px; background: #12B5A5"
        @click="onSend"
      ><Send :size="17" /></button>
    </div>
  </div>
</template>

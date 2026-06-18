<script setup lang="ts">
import { Check, Play, Lock, ArrowRight } from 'lucide-vue-next'

interface Lesson {
  id: string | number
  title: string
  type: 'lesen' | 'uebung'
}

const props = defineProps<{
  lesson: Lesson
  status: 'done' | 'current' | 'locked'
}>()

const emit = defineEmits<{
  (e: 'select', id: Lesson['id']): void
}>()

const typeLabel = computed(() => props.lesson.type === 'lesen' ? 'Lesen' : 'Übung')

function onClick() {
  if (props.status === 'locked') return
  emit('select', props.lesson.id)
}
</script>

<template>
  <!-- DONE -->
  <button
    v-if="status === 'done'"
    type="button"
    class="flex w-full items-center gap-[14px] border border-border bg-surface px-[16px] py-[13px] text-left transition hover:border-teal-soft-border"
    style="border-radius: 14px"
    @click="onClick"
  >
    <span
      class="flex shrink-0 items-center justify-center rounded-full text-on-teal"
      style="width: 26px; height: 26px; background: #2BD68A"
    ><Check :size="15" :stroke-width="3" /></span>
    <span class="flex-1 font-medium text-text-body" style="font-size: 15px">{{ lesson.title }}</span>
    <span
      class="shrink-0 rounded-pill bg-inset-2 px-[12px] py-[4px] font-semibold text-text-muted"
      style="font-size: 12.5px"
    >{{ typeLabel }}</span>
  </button>

  <!-- CURRENT -->
  <button
    v-else-if="status === 'current'"
    type="button"
    class="flex w-full items-center gap-[14px] px-[16px] py-[13px] text-left"
    style="border-radius: 14px; background: rgba(18,181,165,0.08); border: 2px solid #12B5A5; box-shadow: 0 14px 30px -16px rgba(18,181,165,0.6)"
    @click="onClick"
  >
    <span
      class="flex shrink-0 items-center justify-center rounded-full"
      style="width: 26px; height: 26px; border: 2px solid #12B5A5; color: #12B5A5"
    ><Play :size="11" :stroke-width="2.5" fill="currentColor" /></span>
    <span class="flex-1">
      <span class="block font-semibold text-text" style="font-size: 15px">{{ lesson.title }}</span>
      <span class="block font-medium text-teal-700" style="font-size: 13px">Hier geht's weiter</span>
    </span>
    <span
      class="flex shrink-0 items-center gap-[6px] rounded-pill bg-teal-600 px-[16px] py-[8px] font-semibold text-on-teal shadow-btn"
      style="font-size: 13.5px"
    >Starten <ArrowRight :size="15" /></span>
  </button>

  <!-- LOCKED -->
  <div
    v-else
    class="flex w-full cursor-default items-center gap-[14px] border-2 border-dashed bg-transparent px-[16px] py-[13px]"
    style="border-radius: 14px; border-color: rgba(255,255,255,0.12); opacity: 0.55"
  >
    <span
      class="flex shrink-0 items-center justify-center rounded-full"
      style="width: 26px; height: 26px; background: rgba(255,255,255,0.06); color: #5C7A74"
    ><Lock :size="13" /></span>
    <span class="flex-1 font-medium text-text-faint" style="font-size: 15px">{{ lesson.title }}</span>
    <span class="shrink-0 font-semibold text-text-faint" style="font-size: 12.5px">gesperrt</span>
  </div>
</template>

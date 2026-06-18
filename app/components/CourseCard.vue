<script setup lang="ts">
import { Braces, ArrowRight, Lock } from 'lucide-vue-next'

interface Course {
  title: string
  level: string
  status: 'active' | 'locked'
  slug: string
  unlock_hint?: string
  doneCount?: number
  totalCount?: number
  percent?: number
}

const props = defineProps<{
  course: Course
}>()
</script>

<template>
  <!-- ACTIVE -->
  <NuxtLink
    v-if="course.status === 'active'"
    :to="`/kurse/${course.slug}`"
    class="group flex flex-col overflow-hidden border border-border bg-surface no-underline shadow-card transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(18,181,165,0.4)] hover:shadow-elevated"
    style="border-radius: 18px"
  >
    <!-- cover (the one bright moment: keeps a solid teal gradient) -->
    <div
      class="relative overflow-hidden"
      style="height: 120px; background: linear-gradient(130deg,#12B5A5,#0E7A70)"
    >
      <LightCircles :circles="[{ size: 150, top: '-50px', right: '-40px', opacity: 0.1 }]" />
      <Braces
        class="absolute z-10"
        style="top: 16px; left: 18px; color: rgba(6,32,28,0.55)"
        :size="22"
        :stroke-width="2.5"
      />
      <span
        class="absolute z-10 font-display font-extrabold text-white"
        style="bottom: 14px; left: 18px; right: 18px; font-size: 22px; line-height: 1.15"
      >{{ course.title }}</span>
    </div>

    <!-- body -->
    <div class="flex flex-1 flex-col gap-[14px]" style="padding: 18px">
      <div class="flex flex-wrap gap-[8px]">
        <span
          class="rounded-pill bg-teal-soft px-[12px] py-[4px] font-semibold text-teal-700"
          style="font-size: 12.5px"
        >{{ course.level }}</span>
        <span
          class="rounded-pill bg-inset-2 px-[12px] py-[4px] font-semibold text-text-muted"
          style="font-size: 12.5px"
        >{{ course.totalCount }} Lektionen</span>
      </div>

      <div class="flex flex-col gap-[8px]">
        <ProgressBar :percent="course.percent ?? 0" variant="teal" />
        <span class="font-medium text-text-muted" style="font-size: 13px">
          {{ course.percent }} % · {{ course.doneCount }} / {{ course.totalCount }} Lektionen
        </span>
      </div>

      <span
        class="mt-auto flex w-full items-center justify-center gap-[6px] rounded-pill bg-teal-600 px-[16px] py-[11px] font-semibold text-on-teal shadow-btn transition-colors group-hover:bg-teal-700"
        style="font-size: 14px"
      >Weiterlernen <ArrowRight :size="16" /></span>
    </div>
  </NuxtLink>

  <!-- LOCKED -->
  <div
    v-else
    class="flex cursor-default flex-col overflow-hidden border border-border bg-surface-alt opacity-70"
    style="border-radius: 18px"
  >
    <!-- muted cover -->
    <div
      class="relative flex items-center justify-center overflow-hidden"
      style="height: 120px; background: linear-gradient(135deg,#1B2F2A,#16241F)"
    >
      <Lock :size="28" class="text-text-faint" style="opacity: 0.6" />
    </div>

    <!-- body -->
    <div class="flex flex-1 flex-col gap-[12px]" style="padding: 18px">
      <span
        class="self-start rounded-pill bg-inset-2 px-[12px] py-[4px] font-semibold text-text-muted"
        style="font-size: 12.5px"
      >{{ course.level }}</span>
      <span class="font-display font-extrabold text-text" style="font-size: 20px">{{ course.title }}</span>
      <span class="font-medium text-text-muted" style="font-size: 13.5px">{{ course.unlock_hint }}</span>
    </div>
  </div>
</template>

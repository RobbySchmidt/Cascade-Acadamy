<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

interface Course {
  id: number
  title: string
  slug: string
  level: string
  description: string
  status: 'active' | 'locked'
  unlock_hint?: string
  sort: number
  doneCount: number
  totalCount: number
  percent: number
}

const { data: courses } = await useFetch<Course[]>('/api/courses')

const activeCourse = computed(() => courses.value?.find(c => c.status === 'active'))
const done = computed(() => activeCourse.value?.doneCount ?? 0)
const total = computed(() => activeCourse.value?.totalCount ?? 0)
</script>

<template>
  <div class="flex flex-col gap-[28px]">
    <!-- HERO -->
    <section
      class="relative overflow-hidden border border-border"
      style="border-radius: 22px; padding: 40px 44px; background: radial-gradient(130% 150% at 86% -30%, rgba(18,181,165,0.42) 0%, rgba(18,181,165,0.06) 42%, rgba(255,255,255,0) 68%), #11201D"
    >
      <LightCircles
        :circles="[
          { size: 280, top: '-80px', right: '-60px', opacity: 0.035 },
        ]"
      />

      <div class="relative z-10 flex flex-col" style="gap: 16px">
        <span
          class="self-start rounded-pill bg-teal-soft font-semibold uppercase tracking-wide text-teal-500"
          style="padding: 6px 14px; font-size: 12px; letter-spacing: 0.6px"
        >CSS lernen by doing</span>

        <h1
          class="font-display font-extrabold text-text"
          style="font-size: 38px; line-height: 1.1; letter-spacing: -0.5px"
        >Schreib echtes CSS, sieh es <span class="text-teal-700">sofort</span>.</h1>

        <p class="text-text-muted" style="font-size: 17px; line-height: 1.5; max-width: 620px">
          Kleine Lektionen, ein Code-Editor mit Live-Vorschau und automatischer Prüfung. Lerne in deinem Tempo.
        </p>

        <div class="flex flex-wrap items-center" style="gap: 18px; margin-top: 8px">
          <NuxtLink
            v-if="activeCourse"
            :to="`/kurse/${activeCourse.slug}`"
            class="flex items-center gap-[6px] bg-teal-600 font-semibold text-on-teal no-underline shadow-btn transition-colors hover:bg-teal-700"
            style="border-radius: 11px; padding: 13px 22px; font-size: 15px"
          >Weiterlernen <ArrowRight :size="17" /></NuxtLink>
          <span class="font-semibold text-text-faint" style="font-size: 15px">
            {{ done }} von {{ total }} Lektionen geschafft
          </span>
        </div>
      </div>
    </section>

    <!-- DEINE KURSE -->
    <section class="flex flex-col gap-[18px]">
      <div class="flex items-baseline justify-between">
        <h2 class="font-display font-bold text-text" style="font-size: 22px; letter-spacing: -0.3px">Deine Kurse</h2>
        <span class="font-medium text-text-muted" style="font-size: 14px">{{ courses?.length ?? 0 }} Kurse</span>
      </div>

      <div class="grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3">
        <CourseCard v-for="course in courses" :key="course.id" :course="course" />
      </div>
    </section>
  </div>
</template>

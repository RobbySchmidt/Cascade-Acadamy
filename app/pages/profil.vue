<script setup lang="ts">
interface MeUser {
  id: string | number
  display_name: string
  avatar_initials: string
  streak?: number
  started_at?: string
}

interface CourseSummary {
  slug: string
  percent: number
  doneCount: number
  totalCount: number
}

interface DetailLesson { status: string }
interface DetailChapter { id: number; title: string; lessons: DetailLesson[] }
interface CourseDetail { course: unknown; chapters: DetailChapter[] }

const { user } = useAuth()

const { data: me } = await useFetch<{ user: MeUser | null }>('/api/me')
const { data: courses } = await useFetch<CourseSummary[]>('/api/courses')
const { data: detail } = await useFetch<CourseDetail>('/api/courses/css-grundlagen')

// keep the auth state in sync for components that read it
if (me.value?.user) user.value = me.value.user as never

// Persona — fallback to a guest if no logged-in user.
const persona = computed<MeUser>(() => me.value?.user ?? {
  id: 'guest',
  display_name: 'Gast',
  avatar_initials: 'GA',
  streak: 0,
  started_at: new Date().toISOString(),
})

const isGuestPersona = computed(() => !me.value?.user)

const displayName = computed(() => persona.value.display_name)
const initials = computed(() => persona.value.avatar_initials || 'GA')
const streak = computed(() => persona.value.streak ?? 0)

const daysSinceStart = computed(() => {
  const start = persona.value.started_at
  if (!start) return 0
  const ms = Date.now() - new Date(start).getTime()
  return Math.max(0, Math.floor(ms / 86400000))
})

const sublineProgress = computed(() =>
  isGuestPersona.value ? 'lokal gespeichert' : 'gespeichert',
)

// Active course (CSS-Grundlagen) summary.
const activeCourse = computed<CourseSummary | undefined>(() =>
  (courses.value ?? []).find(c => c.slug === 'css-grundlagen'),
)
const doneCount = computed(() => activeCourse.value?.doneCount ?? 0)
const percent = computed(() => activeCourse.value?.percent ?? 0)

// Completed chapters = chapters where every lesson is 'done'.
const completedChapters = computed(() =>
  (detail.value?.chapters ?? []).filter(
    ch => ch.lessons.length > 0 && ch.lessons.every(l => l.status === 'done'),
  ).length,
)

useHead({ title: 'Profil · Cascade Academy' })
</script>

<template>
  <div class="mx-auto max-w-[920px]">
    <!-- IDENTITY ROW -->
    <section class="flex items-center" style="gap: 20px; padding: 4px 0 8px">
      <!-- avatar -->
      <div
        class="flex shrink-0 items-center justify-center font-display font-extrabold text-on-teal shadow-btn"
        style="width: 64px; height: 64px; border-radius: 16px; background: #12B5A5; font-size: 24px"
      >{{ initials }}</div>

      <!-- name + subline -->
      <div class="min-w-0 flex-1">
        <h1 class="font-display font-extrabold text-text" style="font-size: 26px; letter-spacing: -0.5px">{{ displayName }}</h1>
        <p class="mt-[4px] text-text-muted" style="font-size: 15px">
          Lernt seit {{ daysSinceStart }} Tagen · Fortschritt {{ sublineProgress }}
        </p>
      </div>

      <!-- streak -->
      <div class="shrink-0 text-right">
        <div class="font-display font-extrabold text-teal-700" style="font-size: 30px; line-height: 1">{{ streak }}</div>
        <div class="mt-[4px] font-semibold uppercase text-text-faint" style="font-size: 11.5px; letter-spacing: 0.8px">Tage Streak</div>
      </div>
    </section>

    <!-- BIG-PROGRESS STAT -->
    <section
      class="relative overflow-hidden border border-border bg-surface"
      style="border-radius: 20px; padding: 26px 28px; margin-top: 18px; background: radial-gradient(120% 140% at 90% -20%, rgba(18,181,165,0.30) 0%, rgba(18,181,165,0.04) 44%, rgba(255,255,255,0) 70%), #11201D"
    >
      <div class="relative z-10 flex flex-col" style="gap: 16px">
        <div class="flex items-end" style="gap: 14px">
          <span class="font-display font-extrabold leading-none text-text" style="font-size: 64px; letter-spacing: -2px">
            {{ percent }}<span class="text-teal-700">%</span>
          </span>
          <span class="font-medium text-text-muted" style="font-size: 16px; padding-bottom: 8px; line-height: 1.3">
            CSS-Grundlagen<br>abgeschlossen
          </span>
        </div>
        <ProgressBar :percent="percent" variant="teal" />
      </div>
    </section>

    <!-- STAT TILES -->
    <div class="grid grid-cols-2 gap-[18px]" style="margin-top: 18px">
      <StatTile :value="String(doneCount)" label="Lektionen erledigt" />
      <StatTile :value="String(completedChapters)" label="Kapitel abgeschlossen" />
    </div>

    <!-- LIVE-CHAT -->
    <div class="flex items-center justify-between" style="margin-top: 34px; margin-bottom: 14px">
      <h2 class="font-display font-bold text-text" style="font-size: 22px; letter-spacing: -0.3px">Live-Chat · wer ist online</h2>
      <span class="flex items-center font-medium text-text-muted" style="gap: 7px; font-size: 14px">
        <span class="inline-block rounded-full" style="width: 9px; height: 9px; background: #2BD68A" />
        14 online
      </span>
    </div>

    <ChatPanel :me-initials="user?.avatar_initials || me?.user?.avatar_initials || 'MK'" />
  </div>
</template>

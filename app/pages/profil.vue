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
    <!-- IDENTITY BANNER -->
    <section
      class="relative overflow-hidden"
      style="border-radius: 22px; padding: 28px 32px; background: linear-gradient(125deg,#0E7A70,#12B5A5,#3AC9B0); box-shadow: 0 20px 44px -22px rgba(14,122,112,0.7)"
    >
      <LightCircles
        :circles="[
          { size: 260, top: '-90px', right: '-60px', opacity: 0.10 },
          { size: 200, bottom: '-110px', right: '180px', opacity: 0.07 },
        ]"
      />

      <div class="relative z-10 flex items-center" style="gap: 22px">
        <!-- avatar -->
        <div
          class="flex shrink-0 items-center justify-center font-display font-extrabold text-white"
          style="width: 76px; height: 76px; border-radius: 18px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.8); font-size: 28px"
        >{{ initials }}</div>

        <!-- name + subline -->
        <div class="min-w-0 flex-1">
          <h1 class="font-display font-extrabold text-white" style="font-size: 26px; letter-spacing: -0.5px">{{ displayName }}</h1>
          <p class="mt-[4px] text-white/85" style="font-size: 15px">
            Lernt seit {{ daysSinceStart }} Tagen · Fortschritt {{ sublineProgress }}
          </p>
        </div>

        <!-- streak chip -->
        <div
          class="flex shrink-0 items-center"
          style="gap: 10px; padding: 12px 16px; border-radius: 14px; background: rgba(255,255,255,0.16)"
        >
          <span style="font-size: 22px">🔥</span>
          <div class="leading-tight text-white">
            <div class="font-display font-extrabold" style="font-size: 20px">{{ streak }}</div>
            <div class="font-medium text-white/85" style="font-size: 12.5px">Tage Streak</div>
          </div>
        </div>
      </div>
    </section>

    <!-- STAT TILES -->
    <div class="grid grid-cols-3 gap-[18px]" style="margin-top: 18px">
      <StatTile accent="teal" :value="String(doneCount)" label="Lektionen erledigt" icon="📘" />
      <StatTile accent="orange" :value="String(completedChapters)" label="Kapitel abgeschlossen" icon="🎯" />
      <StatTile accent="violet" :value="percent + ' %'" label="CSS-Grundlagen" icon="📈" />
    </div>

    <!-- LIVE-CHAT -->
    <div class="flex items-center justify-between" style="margin-top: 34px; margin-bottom: 14px">
      <h2 class="font-display font-bold text-text" style="font-size: 22px; letter-spacing: -0.3px">Live-Chat · wer ist online</h2>
      <span class="flex items-center font-medium text-text-muted" style="gap: 7px; font-size: 14px">
        <span class="inline-block rounded-full" style="width: 9px; height: 9px; background: #2BB673" />
        14 online
      </span>
    </div>

    <ChatPanel :me-initials="user?.avatar_initials || me?.user?.avatar_initials || 'MK'" />
  </div>
</template>

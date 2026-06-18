<script setup lang="ts">
import { ArrowLeft, Lock, MessageCircle, Users } from 'lucide-vue-next'

interface CourseStatus {
  slug: string
  title: string
  done: number
  total: number
  percent: number
  status: 'begonnen' | 'abgeschlossen'
}

const { user, isGuest, fetchMe } = useAuth()
const chat = useChat()
const { online, conversations, activeKey, generalUnread } = chat

const myId = computed(() => (user.value ? String(user.value.id) : ''))

onMounted(() => {
  if (!user.value && !isGuest.value) fetchMe().catch(() => {})
  chat.openPanel()
})
onBeforeUnmount(() => chat.closePanel())

// ----- active conversation -----
const activeMessages = computed(() => chat.messagesFor(activeKey.value))
const activePartner = computed(() => conversations.value.find(c => c.id === activeKey.value) ?? null)
const isPrivate = computed(() => activeKey.value !== 'general')
const threadDisabled = computed(() => isGuest.value)
const threadPlaceholder = computed(() => {
  if (isGuest.value) return 'Melde dich an, um mitzuschreiben …'
  if (isPrivate.value) return `Nachricht an ${activePartner.value?.name ?? '…'} …`
  return 'Nachricht an alle …'
})

// ----- profile preview -----
interface Profile {
  id: string
  display_name: string
  avatar_initials: string
  started_at: string | null
  courses: CourseStatus[]
}
const selectedId = ref<string | null>(null)
const profile = ref<Profile | null>(null)
const profilePending = ref(false)

async function openProfile(id: string) {
  selectedId.value = id
  profile.value = null
  profilePending.value = true
  try {
    profile.value = await $fetch<Profile>(`/api/users/${id}`)
  } catch {
    profile.value = null
  } finally {
    profilePending.value = false
  }
}
function closeProfile() {
  selectedId.value = null
  profile.value = null
}

function startDm() {
  if (!profile.value) return
  chat.openConversation({
    id: profile.value.id,
    name: profile.value.display_name,
    initials: profile.value.avatar_initials,
  })
  closeProfile()
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000))
}

function onSend(text: string) {
  chat.send(text).catch(() => {})
}
</script>

<template>
  <div class="flex overflow-hidden border border-border bg-surface" style="border-radius: 18px; height: 560px">
    <!-- LEFT RAIL -->
    <aside class="flex shrink-0 flex-col overflow-y-auto border-r border-border p-[16px]" style="width: 262px">
      <!-- ===== profile preview ===== -->
      <template v-if="selectedId">
        <button
          type="button"
          class="mb-[14px] flex items-center gap-[6px] self-start font-medium text-text-muted transition-colors hover:text-text"
          style="font-size: 13px"
          @click="closeProfile"
        ><ArrowLeft :size="15" /> zurück</button>

        <div v-if="profilePending" class="font-medium text-text-faint" style="font-size: 13px">lädt …</div>

        <template v-else-if="profile">
          <div class="flex items-center" style="gap: 12px">
            <span
              class="flex shrink-0 items-center justify-center font-display font-extrabold text-on-teal shadow-btn"
              style="width: 52px; height: 52px; border-radius: 14px; background: #12B5A5; font-size: 19px"
            >{{ profile.avatar_initials }}</span>
            <div class="min-w-0">
              <div class="truncate font-display font-extrabold text-text" style="font-size: 17px">{{ profile.display_name }}</div>
              <div class="font-medium text-text-faint" style="font-size: 12px">lernt seit {{ daysSince(profile.started_at) }} Tagen</div>
            </div>
          </div>

          <button
            v-if="profile.id !== myId && !isGuest"
            type="button"
            class="mt-[14px] flex items-center justify-center gap-[6px] rounded-[10px] bg-teal-soft font-semibold text-teal-700 transition-colors hover:bg-[rgba(18,181,165,0.2)]"
            style="padding: 9px; font-size: 13.5px; border: 1px solid rgba(18,181,165,0.25)"
            @click="startDm"
          ><MessageCircle :size="15" /> Nachricht senden</button>

          <div class="mt-[18px] font-semibold uppercase text-text-faint" style="font-size: 11px; letter-spacing: 0.8px">Kurse</div>
          <ul class="mt-[10px] flex flex-col" style="gap: 12px">
            <li v-for="c in profile.courses" :key="c.slug" class="flex flex-col" style="gap: 6px">
              <div class="flex items-center justify-between" style="gap: 8px">
                <span class="min-w-0 truncate font-semibold text-text-body" style="font-size: 13.5px">{{ c.title }}</span>
                <span
                  class="shrink-0 rounded-pill font-semibold"
                  :class="c.status === 'abgeschlossen' ? 'bg-success-soft text-success' : 'bg-teal-soft text-teal-700'"
                  style="padding: 2px 9px; font-size: 11px"
                >{{ c.status }}</span>
              </div>
              <ProgressBar :percent="c.percent" variant="teal" />
              <span class="font-medium text-text-faint" style="font-size: 11.5px">{{ c.percent }} % · {{ c.done }} / {{ c.total }}</span>
            </li>
            <li v-if="!profile.courses.length" class="font-medium text-text-faint" style="font-size: 12.5px">
              Noch keine Kurse begonnen.
            </li>
          </ul>
        </template>

        <div v-else class="font-medium text-text-faint" style="font-size: 13px">Profil nicht verfügbar.</div>
      </template>

      <!-- ===== conversation navigator ===== -->
      <template v-else>
        <!-- general -->
        <button
          type="button"
          class="flex w-full items-center rounded-[10px] text-left transition-colors"
          :class="activeKey === 'general' ? 'bg-teal-soft' : 'hover:bg-inset-2'"
          style="gap: 10px; padding: 9px 10px"
          @click="chat.setActive('general')"
        >
          <span
            class="flex shrink-0 items-center justify-center rounded-[9px]"
            :style="{ width: '30px', height: '30px', background: activeKey === 'general' ? '#12B5A5' : 'rgba(18,181,165,0.13)', color: activeKey === 'general' ? '#06201C' : '#3FD9C9' }"
          ><Users :size="16" /></span>
          <span class="flex-1 truncate font-semibold" :class="activeKey === 'general' ? 'text-teal-700' : 'text-text-body'" style="font-size: 14px">Allgemeiner Chat</span>
          <span
            v-if="generalUnread"
            class="shrink-0 rounded-full bg-teal-600 font-bold text-on-teal"
            style="min-width: 18px; text-align: center; padding: 1px 6px; font-size: 11px"
          >{{ generalUnread }}</span>
        </button>

        <!-- direct messages -->
        <template v-if="conversations.length">
          <div class="mt-[16px] font-semibold uppercase text-text-faint" style="font-size: 11px; letter-spacing: 0.8px; margin-bottom: 6px">Direktnachrichten</div>
          <ul class="flex flex-col" style="gap: 2px">
            <li v-for="c in conversations" :key="c.id">
              <button
                type="button"
                class="flex w-full items-center rounded-[10px] text-left transition-colors"
                :class="activeKey === c.id ? 'bg-teal-soft' : 'hover:bg-inset-2'"
                style="gap: 10px; padding: 7px 8px"
                @click="chat.setActive(c.id)"
              >
                <span
                  class="flex shrink-0 items-center justify-center rounded-full font-semibold"
                  :style="{ width: '30px', height: '30px', background: 'rgba(18,181,165,0.13)', color: '#3FD9C9', fontSize: '11.5px' }"
                >{{ c.initials }}</span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-semibold" :class="activeKey === c.id ? 'text-teal-700' : 'text-text-body'" style="font-size: 14px">{{ c.name }}</span>
                  <span v-if="c.lastText" class="block truncate font-medium text-text-faint" style="font-size: 12px">{{ c.lastText }}</span>
                </span>
                <span
                  v-if="c.unread"
                  class="shrink-0 rounded-full bg-teal-600 font-bold text-on-teal"
                  style="min-width: 18px; text-align: center; padding: 1px 6px; font-size: 11px"
                >{{ c.unread }}</span>
              </button>
            </li>
          </ul>
        </template>

        <!-- online -->
        <div class="mt-[16px] flex items-center justify-between" style="margin-bottom: 6px">
          <span class="font-semibold uppercase text-text-faint" style="font-size: 11px; letter-spacing: 0.8px">Online</span>
          <span class="flex items-center font-medium text-text-faint" style="gap: 6px; font-size: 12px">
            <span class="inline-block rounded-full" style="width: 7px; height: 7px; background: #2BD68A" />{{ online.length }}
          </span>
        </div>
        <ul class="flex flex-col" style="gap: 2px">
          <li v-for="u in online" :key="u.id">
            <button
              type="button"
              class="flex w-full items-center rounded-[10px] text-left transition-colors hover:bg-inset-2"
              :class="u.id === myId ? 'bg-teal-soft' : ''"
              style="gap: 10px; padding: 7px 8px"
              @click="openProfile(u.id)"
            >
              <span
                class="flex shrink-0 items-center justify-center rounded-full font-semibold"
                :style="{ width: '30px', height: '30px', background: u.id === myId ? '#12B5A5' : 'rgba(18,181,165,0.13)', color: u.id === myId ? '#06201C' : '#3FD9C9', fontSize: '11.5px' }"
              >{{ u.initials }}</span>
              <span class="min-w-0 flex-1 truncate font-semibold" :class="u.id === myId ? 'text-teal-700' : 'text-text-body'" style="font-size: 14px">
                {{ u.id === myId ? 'Du' : u.name }}
              </span>
              <span class="inline-block shrink-0 rounded-full" style="width: 7px; height: 7px; background: #2BD68A" />
            </button>
          </li>
          <li v-if="!online.length" class="font-medium text-text-faint" style="padding: 7px 8px; font-size: 12.5px">
            Gerade ist niemand online.
          </li>
        </ul>
      </template>
    </aside>

    <!-- RIGHT: active conversation -->
    <div class="flex min-h-0 flex-1 flex-col" style="min-width: 0">
      <!-- conversation header -->
      <div class="flex items-center border-b border-border" style="gap: 9px; padding: 14px 20px">
        <span
          class="flex shrink-0 items-center justify-center rounded-[8px]"
          :style="{ width: '28px', height: '28px', background: 'rgba(18,181,165,0.13)', color: '#3FD9C9' }"
        >
          <Lock v-if="isPrivate" :size="14" />
          <Users v-else :size="15" />
        </span>
        <span class="truncate font-display font-bold text-text" style="font-size: 15.5px">
          {{ isPrivate ? (activePartner?.name ?? 'Direktnachricht') : 'Allgemeiner Chat' }}
        </span>
        <span v-if="isPrivate" class="font-medium text-text-faint" style="font-size: 12px">· privat</span>
      </div>

      <ChatThread
        :messages="activeMessages"
        :my-id="myId"
        :disabled="threadDisabled"
        :placeholder="threadPlaceholder"
        :conversation-key="activeKey"
        @send="onSend"
      />
    </div>
  </div>
</template>

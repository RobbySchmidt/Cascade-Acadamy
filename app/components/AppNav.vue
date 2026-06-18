<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'

const route = useRoute()
const { user, fetchMe } = useAuth()
const { dmUnread } = useChat()

onMounted(() => {
  fetchMe().catch(() => {})
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <nav class="border-b border-border bg-surface">
    <div class="mx-auto flex h-16 items-center justify-between" style="max-width: 1180px; padding: 0 28px">
      <NuxtLink to="/kurse" class="no-underline">
        <BrandLogo />
      </NuxtLink>

      <div class="flex items-center gap-[8px]">
        <NuxtLink
          to="/kurse"
          class="rounded-pill px-[14px] py-[8px] font-semibold no-underline transition-colors"
          :class="isActive('/kurse') ? 'bg-teal-soft text-teal-700' : 'text-text-muted'"
          style="font-size: 14px"
        >Kurse</NuxtLink>
        <NuxtLink
          to="/profil"
          class="relative rounded-pill px-[14px] py-[8px] font-semibold no-underline transition-colors"
          :class="isActive('/profil') ? 'bg-teal-soft text-teal-700' : 'text-text-muted'"
          style="font-size: 14px"
        >
          Profil
          <span
            v-if="dmUnread"
            class="absolute flex items-center justify-center rounded-full bg-teal-600 font-bold text-on-teal shadow-btn"
            style="top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; font-size: 11px; line-height: 1"
          >{{ dmUnread }}</span>
        </NuxtLink>

        <NuxtLink
          to="/login"
          class="ml-[6px] flex items-center justify-center rounded-full bg-teal-600 text-on-teal no-underline shadow-btn transition-colors hover:bg-teal-700"
          style="width: 38px; height: 38px"
          :title="user?.display_name ? `${user.display_name} · abmelden` : 'Abmelden'"
          aria-label="Abmelden"
        >
          <LogOut :size="18" />
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'

const route = useRoute()
const { user, fetchMe } = useAuth()

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
          class="rounded-pill px-[14px] py-[8px] font-semibold no-underline transition-colors"
          :class="isActive('/profil') ? 'bg-teal-soft text-teal-700' : 'text-text-muted'"
          style="font-size: 14px"
        >Profil</NuxtLink>

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

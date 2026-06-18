<script setup lang="ts">
// The chat connection lives for as long as the authenticated app is mounted.
// The default layout persists across page navigation, so the SSE stream stays
// open everywhere; the login page uses the `blank` layout and never connects.
const { connect, disconnect } = useChat()

onMounted(connect)
onBeforeUnmount(disconnect)
</script>

<template>
  <div class="min-h-screen">
    <AppNav />
    <main class="mx-auto max-w-[1180px] px-7 py-7"><slot /></main>
    <ChatToast />
  </div>
</template>

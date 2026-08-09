<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { collapsed } = useKeuanganSidebar()

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try { await authStore.fetchMe() } catch { /* ignore */ }
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
    <AppKeuanganNavbar />
    <div :class="collapsed ? 'flex flex-1 flex-col md:pl-16' : 'flex flex-1 flex-col md:pl-64'">
      <main class="flex-1 pb-16 md:pb-0">
        <slot />
      </main>
      <AppFooter />
    </div>
    <AppAdminMobileNav />
  </div>
</template>

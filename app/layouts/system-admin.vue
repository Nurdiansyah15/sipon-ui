<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      await authStore.fetchMe()
    } catch {
      // ignore
    }
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <AppSystemAdminNavbar />
    <main class="flex-1 pb-16 md:pb-0">
      <slot />
    </main>
    <AppFooter />
    <AppSystemAdminMobileNav />
  </div>
</template>
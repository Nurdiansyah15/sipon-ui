<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      await authStore.fetchMe()
    } catch {
      // ignore — cached user data from localStorage is still shown
    }
  }
})

const links = computed<NavigationMenuItem[]>(() => [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar id="default" collapsible resizable class="bg-elevated/25">
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-1">
          <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-inverted">
            S
          </div>
          <span v-if="!collapsed" class="text-sm font-semibold">Sipon</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu :collapsed="collapsed" :items="links" orientation="vertical" tooltip />
      </template>

      <template #footer="{ collapsed }">
        <AppUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>

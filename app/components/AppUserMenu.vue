<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const displayName = computed(() => authStore.user?.fullname || authStore.user?.username || '')
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function toggleDark() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: displayName.value,
      description: authStore.user?.email,
      type: 'label',
    },
  ],
  [
    {
      label: 'My Profile',
      icon: 'i-lucide-user',
      onSelect: () => navigateTo('/profile'),
    },
    {
      label: 'Notifikasi',
      icon: 'i-lucide-bell',
      onSelect: () => navigateTo('/notifikasi'),
    },
    {
      label: 'Dark Mode',
      icon: isDark.value ? 'i-lucide-moon' : 'i-lucide-sun',
      type: 'checkbox',
      checked: isDark.value,
      onUpdateChecked: () => toggleDark(),
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: () => authStore.logout(),
    },
  ],
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end', side: 'bottom' }">
    <UButton color="neutral" variant="ghost" class="rounded-full p-0">
      <UAvatar :src="authStore.user?.avatar_url ?? undefined" :alt="displayName" size="sm" class="cursor-pointer" />
    </UButton>
  </UDropdownMenu>
</template>

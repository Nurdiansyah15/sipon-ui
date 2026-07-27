<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const displayName = computed(() => authStore.user?.fullname || authStore.user?.username || '')
const darkMode = ref(false)

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
      label: 'Dark Mode',
      icon: 'i-lucide-sun',
      type: 'checkbox',
      checked: darkMode.value,
      onUpdateChecked: (v: boolean) => { darkMode.value = v },
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
      <UAvatar :alt="displayName" size="sm" class="cursor-pointer" />
    </UButton>
  </UDropdownMenu>
</template>

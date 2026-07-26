<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

defineProps<{
  collapsed?: boolean
}>()

const authStore = useAuthStore()

const displayName = computed(() => authStore.user?.fullname || authStore.user?.username || '')

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
      label: 'Keluar',
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: () => authStore.logout(),
    },
  ],
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ side: 'top', align: 'start' }" class="w-full">
    <UButton
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: collapsed ? 'hidden' : '' }"
    >
      <UAvatar :alt="displayName" size="xs" />
      <template v-if="!collapsed" #default>
        <span class="truncate text-sm">{{ displayName }}</span>
      </template>
      <template #trailing>
        <UIcon v-if="!collapsed" name="i-lucide-chevrons-up-down" class="ml-auto size-4 shrink-0" />
      </template>
    </UButton>
  </UDropdownMenu>
</template>

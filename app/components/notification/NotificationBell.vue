<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification'

const store = useNotificationStore()

const isOpen = ref(false)

onMounted(() => {
  store.fetchUnreadCount()
})

watch(isOpen, async (open) => {
  if (open) {
    await store.fetchInbox({ page: 1, limit: 10 })
  }
})

function goToInbox() {
  isOpen.value = false
  navigateTo('/notifikasi')
}

function goToSettings() {
  isOpen.value = false
  navigateTo('/notifikasi/pengaturan')
}
</script>

<template>
  <UDropdownMenu
    v-model:open="isOpen"
    :items="[
      [
        { label: 'Notifikasi', slot: 'header' },
      ],
      [
        { label: 'Lihat semua notifikasi', icon: 'i-lucide-inbox', onSelect: goToInbox },
        { label: 'Preferensi notifikasi', icon: 'i-lucide-settings', onSelect: goToSettings },
      ],
    ]"
    :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      square
      class="relative text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
    >
      <UIcon name="i-lucide-bell" class="h-5 w-5" />
      <span
        v-if="store.unreadCount > 0"
        class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white"
      >
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </UButton>

    <template #header>
      <div class="flex items-center justify-between px-1">
        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifikasi</span>
        <span v-if="store.unreadCount > 0" class="text-xs text-teal-600 dark:text-teal-400">
          {{ store.unreadCount }} belum dibaca
        </span>
      </div>
    </template>
  </UDropdownMenu>
</template>

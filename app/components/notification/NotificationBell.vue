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

function close() {
  isOpen.value = false
}

function goToInbox() {
  close()
  navigateTo('/notifikasi')
}

function goToSettings() {
  close()
  navigateTo('/notifikasi/pengaturan')
}

async function handleMarkAllRead() {
  await store.markAllRead()
}
</script>

<template>
  <UPopover v-model:open="isOpen" :content="{ align: 'end', side: 'bottom', sideOffset: 8 }">
    <UButton
      color="neutral"
      variant="ghost"
      square
      class="relative text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
    >
      <UIcon name="i-lucide-bell" class="h-5 w-5" />
      <span
        v-if="store.unreadCount > 0"
        class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900"
      >
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </UButton>

    <template #content>
      <div class="w-96 max-w-[calc(100vw-2rem)]">
        <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifikasi</span>
            <button
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              @click="goToSettings"
            >
              <UIcon name="i-lucide-settings" class="h-4 w-4" />
            </button>
          </div>
          <div v-if="store.unreadCount > 0" class="mt-2 flex items-center justify-between gap-3">
            <span class="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
              {{ store.unreadCount }} belum dibaca
            </span>
            <button
              type="button"
              class="whitespace-nowrap text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
              @click="handleMarkAllRead"
            >
              Tandai semua dibaca
            </button>
          </div>
        </div>

        <div v-if="store.isLoading && store.items.length === 0" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Memuat notifikasi...
        </div>

        <div v-else-if="store.items.length === 0" class="flex flex-col items-center gap-2 py-10 text-center">
          <UIcon name="i-lucide-bell-off" class="h-6 w-6 text-gray-300 dark:text-gray-600" />
          <p class="text-sm text-gray-500 dark:text-gray-400">Belum ada notifikasi.</p>
        </div>

        <div
          v-else
          class="max-h-96 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
          @click="close"
        >
          <NotificationItemRow
            v-for="item in store.items"
            :key="item.id"
            :item="item"
          />
        </div>

        <div class="border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
          <button
            type="button"
            class="w-full text-center text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            @click="goToInbox"
          >
            Lihat semua notifikasi
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>

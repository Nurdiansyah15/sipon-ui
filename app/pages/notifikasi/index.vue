<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification'

definePageMeta({ layout: 'default' })

const store = useNotificationStore()

const filterUnreadOnly = ref(false)
const currentPage = ref(1)
const pageSize = 20

async function loadInbox(page = 1) {
  currentPage.value = page
  await store.fetchInbox({
    unread_only: filterUnreadOnly.value,
    page,
    limit: pageSize,
  })
}

onMounted(() => loadInbox(1))

watch(filterUnreadOnly, () => loadInbox(1))

async function handleMarkAllRead() {
  await store.markAllRead()
}

function loadMore() {
  loadInbox(currentPage.value + 1)
}

const hasMore = computed(() => {
  if (!store.meta) return false
  return currentPage.value < store.meta.total_pages
})

const showMarkAll = computed(() => store.unreadCount > 0)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">Notifikasi</h1>
      <UButton
        v-if="showMarkAll"
        variant="ghost"
        size="sm"
        @click="handleMarkAllRead"
      >
        Tandai semua dibaca
      </UButton>
    </div>

    <div class="mb-4 flex gap-2">
      <UButton
        :variant="!filterUnreadOnly ? 'solid' : 'ghost'"
        size="sm"
        @click="filterUnreadOnly = false"
      >
        Semua
      </UButton>
      <UButton
        :variant="filterUnreadOnly ? 'solid' : 'ghost'"
        size="sm"
        @click="filterUnreadOnly = true"
      >
        Belum dibaca
      </UButton>
    </div>

    <div v-if="store.isLoading && store.items.length === 0" class="py-12 text-center text-sm text-gray-500">
      Memuat notifikasi...
    </div>

    <div v-else-if="store.items.length === 0" class="rounded-lg border border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-900">
      <UIcon name="i-lucide-bell-off" class="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {{ filterUnreadOnly ? 'Tidak ada notifikasi yang belum dibaca.' : 'Tidak ada notifikasi.' }}
      </p>
    </div>

    <div v-else class="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900">
      <NotificationItemRow
        v-for="item in store.items"
        :key="item.id"
        :item="item"
      />
    </div>

    <div v-if="hasMore" class="mt-4 text-center">
      <UButton
        variant="ghost"
        :loading="store.isLoading"
        @click="loadMore"
      >
        Muat lagi
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NotificationItem } from '#shared/types/Notification'
import { useNotificationStore } from '~/stores/notification'

const props = defineProps<{
  item: NotificationItem
}>()

const store = useNotificationStore()

const moduleIcons: Record<string, string> = {
  identity: 'i-lucide-log-in',
  keuangan: 'i-lucide-wallet',
  psb: 'i-lucide-user-plus',
  akademik: 'i-lucide-graduation-cap',
  kesantrian: 'i-lucide-book-open',
  announcement: 'i-lucide-megaphone',
}

const icon = computed(() => moduleIcons[props.item.module] || 'i-lucide-bell')

const timeAgo = computed(() => {
  const d = new Date(props.item.created_at)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'baru saja'
  if (diffMin < 60) return `${diffMin}m lalu`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}j lalu`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}h lalu`
})

async function handleClick() {
  if (!props.item.is_read) {
    await store.markRead(props.item.id)
  }
  if (props.item.click_action) {
    navigateTo(props.item.click_action)
  }
}
</script>

<template>
  <div
    class="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    :class="{ 'bg-teal-50/50 dark:bg-teal-900/10': !item.is_read }"
    role="button"
    @click="handleClick"
  >
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      :class="item.is_read ? 'bg-gray-100 dark:bg-gray-800' : 'bg-teal-100 dark:bg-teal-900/30'"
    >
      <UIcon
        :name="icon"
        class="h-4 w-4"
        :class="item.is_read ? 'text-gray-400' : 'text-teal-600 dark:text-teal-400'"
      />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <p
          class="truncate text-sm"
          :class="item.is_read ? 'text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-gray-100'"
        >
          {{ item.title }}
        </p>
        <span v-if="!item.is_read" class="h-2 w-2 shrink-0 rounded-full bg-teal-500" />
      </div>
      <p class="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
        {{ item.body }}
      </p>
      <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
        {{ timeAgo }}
      </p>
    </div>
  </div>
</template>

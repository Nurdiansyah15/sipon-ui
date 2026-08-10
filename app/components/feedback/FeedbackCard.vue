<script setup lang="ts">
import type { FeedbackItem } from '#shared/types/Feedback'
import { useFeedbackStore } from '~/stores/feedback'
import { useAuthStore } from '~/stores/auth'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  item: FeedbackItem
}>()

const emit = defineEmits<{
  updated: []
}>()

const store = useFeedbackStore()
const authStore = useAuthStore()
const toast = useToast()
const isDeleting = ref(false)
const showDelete = ref(false)

const isOwner = computed(() => props.item.user?.user_id === authStore.user?.id)
const displayName = computed(() => props.item.user?.fullname || props.item.user?.username || 'Pengguna')
const createdLabel = computed(() => new Date(props.item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }))

async function onLikedUpdate(liked: boolean, count: number) {
  const target = store.items.find((f) => f.id === props.item.id) ?? store.selected
  if (target) {
    target.is_liked = liked
    target.like_count = count
  }
  emit('updated')
}

async function remove() {
  isDeleting.value = true
  try {
    await store.deleteFeedback(props.item.id)
    toast.add({ title: 'Feedback berhasil dihapus', color: 'success' })
    emit('updated')
  } catch (err) {
    toast.add({ title: 'Gagal menghapus', description: parseApiError(err), color: 'error' })
  } finally {
    isDeleting.value = false
    showDelete.value = false
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-2">
        <UAvatar :alt="displayName" size="sm" />
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ displayName }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ createdLabel }}</p>
        </div>
      </div>
      <FeedbackCategoryBadge :category="item.category" size="sm" />
    </div>

    <div v-if="item.is_takedown" class="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-shield-alert" class="h-5 w-5 shrink-0 text-red-500" />
        <p class="text-sm text-red-700 dark:text-red-300">
          Feedback ini telah ditakedown oleh moderator.
          <span v-if="item.takedown_reason" class="block text-xs text-red-500 dark:text-red-400">Alasan: {{ item.takedown_reason }}</span>
        </p>
      </div>
    </div>

    <NuxtLink :to="`/feedback/${item.id}`" class="mt-3 block">
      <h3 class="text-base font-semibold text-gray-900 hover:text-teal-600 dark:text-gray-100 dark:hover:text-teal-400">
        {{ item.title }}
      </h3>
      <p class="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{{ item.body }}</p>
    </NuxtLink>

    <div class="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
      <FeedbackLikeButton
        :feedback-id="item.id"
        :liked="item.is_liked"
        :count="item.like_count"
        @updated="onLikedUpdate"
      />

      <NuxtLink
        :to="`/feedback/${item.id}`"
        class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <UIcon name="i-lucide-message-circle" class="h-4 w-4" />
        <span class="tabular-nums">{{ item.comment_count }}</span>
      </NuxtLink>

      <span
        v-if="item.attachment_count > 0"
        class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-gray-500 dark:text-gray-400"
      >
        <UIcon name="i-lucide-paperclip" class="h-4 w-4" />
        <span class="tabular-nums">{{ item.attachment_count }}</span>
      </span>

      <div class="flex-1" />

      <UButton
        v-if="item.is_takedown"
        variant="ghost"
        size="xs"
        icon="i-lucide-shield-alert"
        class="text-red-500"
        disabled
      >
        Takedown
      </UButton>

      <UButton variant="ghost" size="xs" icon="i-lucide-eye" :to="`/feedback/${item.id}`">Detail</UButton>
      <UButton v-if="isOwner" variant="ghost" size="xs" color="error" icon="i-lucide-trash-2" @click="showDelete = true" />
    </div>

    <UModal v-model:open="showDelete" :dismissible="!isDeleting">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Hapus Feedback</h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Yakin ingin menghapus feedback ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div class="mt-6 flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" :disabled="isDeleting" @click="showDelete = false">Batal</UButton>
            <UButton color="error" :loading="isDeleting" @click="remove">Hapus</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

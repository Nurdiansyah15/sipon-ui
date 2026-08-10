<script setup lang="ts">
import type { FeedbackComment } from '#shared/types/Feedback'
import { useFeedbackStore } from '~/stores/feedback'
import { useAuthStore } from '~/stores/auth'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  comment: FeedbackComment
}>()

const emit = defineEmits<{
  reply: [replyToId: string, replyToName: string]
  updated: []
}>()

const store = useFeedbackStore()
const authStore = useAuthStore()
const toast = useToast()
const isLiking = ref(false)
const isDeleting = ref(false)
const showDelete = ref(false)
const isEditing = ref(false)
const editBody = ref('')

const isOwner = computed(() => props.comment.user?.user_id === authStore.user?.id)
const displayName = computed(() => props.comment.user?.fullname || props.comment.user?.username || 'Pengguna')
const createdLabel = computed(() => new Date(props.comment.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }))
const replyToName = computed(() => props.comment.reply_to_user?.fullname || props.comment.reply_to_user?.username || null)

function startEdit() {
  editBody.value = props.comment.body
  isEditing.value = true
}

async function saveEdit() {
  if (!editBody.value.trim()) return
  isLiking.value = true
  try {
    await store.updateComment(props.comment.id, editBody.value.trim())
    props.comment.body = editBody.value.trim()
    isEditing.value = false
    toast.add({ title: 'Komentar diperbarui', color: 'success' })
    emit('updated')
  } catch (err) {
    toast.add({ title: 'Gagal memperbarui komentar', description: parseApiError(err), color: 'error' })
  } finally {
    isLiking.value = false
  }
}

async function toggleLike() {
  if (isLiking.value) return
  isLiking.value = true
  try {
    const res = await store.toggleLikeComment(props.comment.id)
    props.comment.is_liked = res.liked
    props.comment.like_count = res.like_count
    emit('updated')
  } catch (err) {
    toast.add({ title: 'Gagal mengubah like', description: parseApiError(err), color: 'error' })
  } finally {
    isLiking.value = false
  }
}

async function remove() {
  isDeleting.value = true
  try {
    await store.deleteComment(props.comment.id)
    toast.add({ title: 'Komentar dihapus', color: 'success' })
    emit('updated')
  } catch (err) {
    toast.add({ title: 'Gagal menghapus komentar', description: parseApiError(err), color: 'error' })
  } finally {
    isDeleting.value = false
    showDelete.value = false
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-2">
        <UAvatar :alt="displayName" size="sm" />
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ displayName }}
            <span v-if="replyToName" class="text-xs font-normal text-gray-400">
              balas ke <span class="text-teal-600 dark:text-teal-400">@{{ replyToName }}</span>
            </span>
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ createdLabel }}</p>
        </div>
      </div>
      <UBadge v-if="comment.is_takedown" color="error" variant="subtle" size="sm">Takedown</UBadge>
    </div>

    <div v-if="comment.is_takedown" class="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
      <p class="text-sm text-red-700 dark:text-red-300">
        Komentar ini telah ditakedown oleh moderator.
        <span v-if="comment.takedown_reason" class="block text-xs text-red-500 dark:text-red-400">Alasan: {{ comment.takedown_reason }}</span>
      </p>
    </div>

    <div v-else>
      <p v-if="!isEditing" class="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{{ comment.body }}</p>
      <div v-else class="mt-2">
        <UTextarea v-model="editBody" :rows="2" />
        <div class="mt-2 flex justify-end gap-2">
          <UButton size="xs" variant="ghost" color="neutral" @click="isEditing = false">Batal</UButton>
          <UButton size="xs" color="primary" :loading="isLiking" @click="saveEdit">Simpan</UButton>
        </div>
      </div>
    </div>

    <div v-if="!comment.is_takedown" class="mt-3 flex items-center gap-1">
      <UButton
        icon="i-lucide-thumbs-up"
        :color="comment.is_liked ? 'primary' : 'neutral'"
        :variant="comment.is_liked ? 'soft' : 'ghost'"
        size="xs"
        :loading="isLiking"
        class="gap-1.5"
        @click="toggleLike"
      >
        <span class="tabular-nums">{{ comment.like_count }}</span>
      </UButton>

      <UButton
        variant="ghost"
        size="xs"
        icon="i-lucide-corner-up-left"
        @click="emit('reply', comment.id, displayName)"
      >
        Balas
      </UButton>

      <div class="flex-1" />

      <UButton v-if="isOwner && !isEditing" variant="ghost" size="xs" icon="i-lucide-pencil" @click="startEdit" />
      <UButton v-if="isOwner" variant="ghost" size="xs" color="error" icon="i-lucide-trash-2" @click="showDelete = true" />
    </div>

    <UModal v-model:open="showDelete" :dismissible="!isDeleting">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Hapus Komentar</h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Yakin ingin menghapus komentar ini?</p>
          <div class="mt-6 flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" :disabled="isDeleting" @click="showDelete = false">Batal</UButton>
            <UButton color="error" :loading="isDeleting" @click="remove">Hapus</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

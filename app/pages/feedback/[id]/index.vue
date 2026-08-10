<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useFeedbackStore } from '~/stores/feedback'
import { useAuthStore } from '~/stores/auth'
import { parseApiError } from '~/utils/errorParser'
import type { FeedbackCategory } from '#shared/types/Feedback'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const store = useFeedbackStore()
const authStore = useAuthStore()
const toast = useToast()

const feedbackId = computed(() => (route.params as { id?: string }).id ?? '')
const isOwner = computed(() => store.selected?.user?.user_id === authStore.user?.id)

const showDelete = ref(false)
const isDeleting = ref(false)
const isEditing = ref(false)
const isSavingEdit = ref(false)

const replyToId = ref<string | null>(null)
const replyToName = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([store.fetchDetail(feedbackId.value), store.fetchComments(feedbackId.value)])
})

const editSchema = z.object({
  body: z.string().trim().min(3, 'Deskripsi minimal 3 karakter').max(5000, 'Maksimal 5000 karakter'),
})
type EditSchema = z.output<typeof editSchema>

const editState = reactive<Partial<EditSchema>>({ body: '' })

function startEdit() {
  if (!store.selected) return
  editState.body = store.selected.body
  isEditing.value = true
}

async function saveEdit(event: FormSubmitEvent<EditSchema>) {
  if (!store.selected) return
  isSavingEdit.value = true
  try {
    await store.updateFeedback(store.selected.id, {
      title: store.selected.title,
      body: event.data.body,
      category: store.selected.category,
    })
    toast.add({ title: 'Feedback diperbarui', color: 'success' })
    isEditing.value = false
    await store.fetchDetail(feedbackId.value)
  } catch (err) {
    toast.add({ title: 'Gagal memperbarui', description: parseApiError(err), color: 'error' })
  } finally {
    isSavingEdit.value = false
  }
}

async function remove() {
  isDeleting.value = true
  try {
    await store.deleteFeedback(feedbackId.value)
    toast.add({ title: 'Feedback dihapus', color: 'success' })
    router.push('/feedback')
  } catch (err) {
    toast.add({ title: 'Gagal menghapus', description: parseApiError(err), color: 'error' })
  } finally {
    isDeleting.value = false
    showDelete.value = false
  }
}

function onFeedbackLiked(liked: boolean, count: number) {
  if (store.selected) {
    store.selected.is_liked = liked
    store.selected.like_count = count
  }
}

function setReply(commentId: string, name: string) {
  replyToId.value = commentId
  replyToName.value = name
}

function clearReply() {
  replyToId.value = null
  replyToName.value = null
}

async function onCommentDone() {
  clearReply()
  await store.fetchComments(feedbackId.value)
  await store.fetchDetail(feedbackId.value)
}

async function deleteAttachment(attachmentId: string) {
  try {
    await store.deleteAttachment(feedbackId.value, attachmentId)
    toast.add({ title: 'Attachment dihapus', color: 'success' })
    await store.fetchDetail(feedbackId.value)
  } catch (err) {
    toast.add({ title: 'Gagal menghapus attachment', description: parseApiError(err), color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <UButton variant="ghost" icon="i-lucide-arrow-left" to="/feedback" class="mb-4">Kembali</UButton>

    <!-- Loading -->
    <div v-if="store.isLoading && !store.selected" class="space-y-4">
      <USkeleton class="h-8 w-2/3" />
      <USkeleton class="h-40 w-full" />
    </div>

    <!-- Error -->
    <div v-else-if="store.error && !store.selected" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ store.error }}</p>
    </div>

    <div v-else-if="store.selected" class="space-y-6">
      <!-- Header card -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <UAvatar :alt="store.selected.user?.fullname || store.selected.user?.username || 'Pengguna'" size="md" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ store.selected.user?.fullname || store.selected.user?.username || 'Pengguna' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ new Date(store.selected.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }}
              </p>
            </div>
          </div>
          <FeedbackCategoryBadge :category="store.selected.category" />
        </div>

        <h1 class="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">{{ store.selected.title }}</h1>

        <div v-if="store.selected.is_takedown" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-shield-alert" class="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p class="text-sm font-medium text-red-700 dark:text-red-300">Feedback ini telah ditakedown oleh moderator.</p>
              <p v-if="store.selected.takedown_reason" class="mt-1 text-xs text-red-500 dark:text-red-400">
                Alasan: {{ store.selected.takedown_reason }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="isEditing">
          <UForm :schema="editSchema" :state="editState" class="mt-4 space-y-3" @submit="saveEdit">
            <UFormField name="body">
              <UTextarea v-model="editState.body" :rows="6" />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" color="neutral" :disabled="isSavingEdit" @click="isEditing = false">Batal</UButton>
              <UButton type="submit" :loading="isSavingEdit">Simpan</UButton>
            </div>
          </UForm>
        </div>
        <p v-else class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {{ store.selected.body }}
        </p>

        <!-- Stats + actions -->
        <div class="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <FeedbackLikeButton
            :feedback-id="store.selected.id"
            :liked="store.selected.is_liked"
            :count="store.selected.like_count"
            @updated="onFeedbackLiked"
          />
          <span class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
            <UIcon name="i-lucide-message-circle" class="h-4 w-4" />
            <span class="tabular-nums">{{ store.selected.comment_count }}</span> komentar
          </span>
          <span v-if="store.selected.attachment_count > 0" class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
            <UIcon name="i-lucide-paperclip" class="h-4 w-4" />
            <span class="tabular-nums">{{ store.selected.attachment_count }}</span> lampiran
          </span>

          <div class="flex-1" />

          <template v-if="isOwner">
            <UButton variant="ghost" size="sm" icon="i-lucide-pencil" @click="startEdit">Edit</UButton>
            <UButton variant="ghost" size="sm" color="error" icon="i-lucide-trash-2" @click="showDelete = true">Hapus</UButton>
          </template>
        </div>
      </div>

      <!-- Attachments -->
      <div v-if="(store.selected.attachments?.length ?? 0) > 0 || isOwner" class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100">Lampiran</h2>
          <FeedbackAttachmentUploader v-if="isOwner && !store.selected.is_takedown" :feedback-id="store.selected.id" @updated="store.fetchDetail(feedbackId)" />
        </div>

        <ul class="space-y-2">
          <li
            v-for="att in store.selected.attachments"
            :key="att.id"
            class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
          >
            <UIcon name="i-lucide-file" class="h-4 w-4 shrink-0 text-gray-400" />
            <a
              :href="att.download_url"
              target="_blank"
              rel="noopener"
              class="min-w-0 flex-1 truncate text-sm text-teal-600 hover:underline dark:text-teal-400"
            >
              {{ att.original_filename || att.key }}
            </a>
            <span v-if="att.size" class="text-xs text-gray-400">{{ (att.size / 1024 / 1024).toFixed(2) }} MB</span>
            <UButton v-if="isOwner" variant="ghost" size="xs" icon="i-lucide-trash-2" color="error" square @click="deleteAttachment(att.id)" />
          </li>
        </ul>
      </div>

      <!-- Comments -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-gray-100">Komentar</h2>

        <div v-if="store.comments.length === 0" class="mb-4 text-sm text-gray-500">Belum ada komentar.</div>
        <div v-else class="mb-4 space-y-3">
          <FeedbackCommentItem
            v-for="comment in store.comments"
            :key="comment.id"
            :comment="comment"
            @reply="setReply"
            @updated="onCommentDone"
          />
        </div>

        <FeedbackCommentForm
          v-if="!store.selected.is_takedown"
          :feedback-id="feedbackId"
          :reply-to-id="replyToId"
          :reply-to-name="replyToName"
          @done="onCommentDone"
        />
        <p v-else class="text-sm text-gray-500">Komentar ditutup untuk feedback yang ditakedown.</p>
      </div>
    </div>

    <!-- Delete confirm -->
    <UModal v-model:open="showDelete" :dismissible="!isDeleting">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Hapus Feedback</h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Yakin ingin menghapus feedback ini? Tindakan ini tidak dapat dibatalkan.</p>
          <div class="mt-6 flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" :disabled="isDeleting" @click="showDelete = false">Batal</UButton>
            <UButton color="error" :loading="isDeleting" @click="remove">Hapus</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

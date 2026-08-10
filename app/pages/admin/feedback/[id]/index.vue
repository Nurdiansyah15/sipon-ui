<script setup lang="ts">
import { useFeedbackAdminStore } from '~/stores/feedbackAdmin'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'feedback' })

const route = useRoute()
const store = useFeedbackAdminStore()
const toast = useToast()

const feedbackId = computed(() => (route.params as { id?: string }).id ?? '')

const showTakedownFeedback = ref(false)
const showRestoreFeedback = ref(false)

const showTakedownComment = ref<string | null>(null)
const showRestoreComment = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([store.fetchDetail(feedbackId.value), store.fetchComments(feedbackId.value)])
})

async function reload() {
  await Promise.all([store.fetchDetail(feedbackId.value), store.fetchComments(feedbackId.value)])
}

function onFeedbackModerated() {
  showTakedownFeedback.value = false
  showRestoreFeedback.value = false
  reload()
}

function onCommentModerated() {
  showTakedownComment.value = null
  showRestoreComment.value = null
  reload()
}

async function openCommentDetail(commentId: string) {
  const comment = store.comments.find((c) => c.id === commentId)
  if (!comment) return
  if (comment.is_takedown) showRestoreComment.value = commentId
  else showTakedownComment.value = commentId
}

function closeTakedownComment(v: boolean) {
  if (!v) showTakedownComment.value = null
}

function closeRestoreComment(v: boolean) {
  if (!v) showRestoreComment.value = null
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <UButton variant="ghost" icon="i-lucide-arrow-left" to="/admin/feedback" class="mb-4">Kembali</UButton>

    <div v-if="store.isLoading && !store.selected" class="space-y-4">
      <USkeleton class="h-8 w-2/3" />
      <USkeleton class="h-40 w-full" />
    </div>

    <div v-else-if="store.error && !store.selected" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ store.error }}</p>
    </div>

    <div v-else-if="store.selected" class="space-y-6">
      <!-- Feedback header -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <FeedbackCategoryBadge :category="store.selected.category" size="sm" />
              <UBadge v-if="store.selected.is_takedown" color="error" variant="subtle" size="sm">Takedown</UBadge>
              <span class="text-xs text-gray-400">
                {{ store.selected.user?.fullname || store.selected.user?.username || 'Pengguna' }}
              </span>
            </div>
            <h1 class="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">{{ store.selected.title }}</h1>
          </div>

          <div class="flex gap-2">
            <UButton
              v-if="!store.selected.is_takedown"
              color="error"
              variant="soft"
              icon="i-lucide-shield-alert"
              @click="showTakedownFeedback = true"
            >
              Takedown
            </UButton>
            <UButton
              v-else
              color="success"
              variant="soft"
              icon="i-lucide-shield-check"
              @click="showRestoreFeedback = true"
            >
              Restore
            </UButton>
          </div>
        </div>

        <p v-if="store.selected.is_takedown" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <strong>Alasan takedown:</strong> {{ store.selected.takedown_reason || '—' }}
        </p>

        <p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {{ store.selected.body }}
        </p>

        <div class="mt-4 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1"><UIcon name="i-lucide-thumbs-up" class="h-4 w-4" />{{ store.selected.like_count }}</span>
          <span class="flex items-center gap-1"><UIcon name="i-lucide-message-circle" class="h-4 w-4" />{{ store.selected.comment_count }}</span>
          <span class="flex items-center gap-1"><UIcon name="i-lucide-paperclip" class="h-4 w-4" />{{ store.selected.attachment_count }}</span>
          <span>{{ new Date(store.selected.created_at).toLocaleString('id-ID') }}</span>
        </div>
      </div>

      <!-- Attachments -->
      <div v-if="(store.selected.attachments?.length ?? 0) > 0" class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <h2 class="mb-3 font-semibold text-gray-900 dark:text-gray-100">Lampiran</h2>
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
          </li>
        </ul>
      </div>

      <!-- Comments moderation -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <h2 class="mb-4 font-semibold text-gray-900 dark:text-gray-100">Moderasi Komentar</h2>

        <div v-if="store.comments.length === 0" class="text-sm text-gray-500">Belum ada komentar.</div>
        <div v-else class="space-y-3">
          <div
            v-for="comment in store.comments"
            :key="comment.id"
            class="rounded-lg border p-4"
            :class="comment.is_takedown
              ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50'
              : 'border-gray-200 dark:border-gray-700'"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ comment.user?.fullname || comment.user?.username || 'Pengguna' }}
                  <span v-if="comment.reply_to_user" class="text-xs font-normal text-gray-400">
                    balas ke @{{ comment.reply_to_user.fullname || comment.reply_to_user.username }}
                  </span>
                </p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ comment.body }}</p>
                <div class="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span class="flex items-center gap-1"><UIcon name="i-lucide-thumbs-up" class="h-3.5 w-3.5" />{{ comment.like_count }}</span>
                  <span>{{ new Date(comment.created_at).toLocaleString('id-ID') }}</span>
                  <UBadge v-if="comment.is_takedown" color="error" variant="subtle" size="sm">Takedown</UBadge>
                </div>
                <p v-if="comment.is_takedown && comment.takedown_reason" class="mt-1 text-xs text-red-600 dark:text-red-400">
                  Alasan: {{ comment.takedown_reason }}
                </p>
              </div>

              <UButton
                :color="comment.is_takedown ? 'success' : 'error'"
                :variant="comment.is_takedown ? 'soft' : 'soft'"
                size="xs"
                :icon="comment.is_takedown ? 'i-lucide-shield-check' : 'i-lucide-shield-alert'"
                @click="openCommentDetail(comment.id)"
              >
                {{ comment.is_takedown ? 'Restore' : 'Takedown' }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FeedbackTakedownModal
      :open="showTakedownFeedback"
      :feedback-id="feedbackId"
      @update:open="showTakedownFeedback = $event"
      @done="onFeedbackModerated"
    />

    <FeedbackRestoreModal
      :open="showRestoreFeedback"
      :feedback-id="feedbackId"
      @update:open="showRestoreFeedback = $event"
      @done="onFeedbackModerated"
    />

    <FeedbackTakedownModal
      :open="!!showTakedownComment"
      :comment-id="showTakedownComment ?? undefined"
      @update:open="closeTakedownComment"
      @done="onCommentModerated"
    />

    <FeedbackRestoreModal
      :open="!!showRestoreComment"
      :comment-id="showRestoreComment ?? undefined"
      @update:open="closeRestoreComment"
      @done="onCommentModerated"
    />
  </div>
</template>

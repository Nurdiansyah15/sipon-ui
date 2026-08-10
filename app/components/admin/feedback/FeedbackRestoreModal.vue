<script setup lang="ts">
import { useFeedbackAdminStore } from '~/stores/feedbackAdmin'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  open: boolean
  feedbackId?: string
  commentId?: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  done: []
}>()

const store = useFeedbackAdminStore()
const toast = useToast()

const isFeedback = computed(() => !!props.feedbackId)

async function restore() {
  try {
    if (isFeedback.value && props.feedbackId) {
      await store.restoreFeedback(props.feedbackId)
    } else if (props.commentId) {
      await store.restoreComment(props.commentId)
    }
    toast.add({ title: isFeedback.value ? 'Feedback direstore' : 'Komentar direstore', color: 'success' })
    emit('update:open', false)
    emit('done')
  } catch (err) {
    toast.add({ title: 'Gagal', description: parseApiError(err), color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!store.isSubmitting" @update:open="v => !store.isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Restore {{ isFeedback ? 'Feedback' : 'Komentar' }}
          </h3>
          <UButton v-if="!store.isSubmitting" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="emit('update:open', false)" />
        </div>

        <p class="mb-4 text-sm text-gray-500">
          Konten yang direstore akan kembali tampil untuk publik.
        </p>

        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="store.isSubmitting" @click="emit('update:open', false)">Batal</UButton>
          <UButton color="success" :loading="store.isSubmitting" @click="restore">Restore</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

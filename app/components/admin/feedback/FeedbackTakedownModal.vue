<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
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

const schema = z.object({
  reason: z.string().trim().min(1, 'Alasan takedown wajib diisi').max(500, 'Maksimal 500 karakter'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ reason: '' })

const isFeedback = computed(() => !!props.feedbackId)

watch(
  () => props.open,
  (v) => { if (v) state.reason = '' },
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    if (isFeedback.value && props.feedbackId) {
      await store.takedownFeedback(props.feedbackId, event.data.reason)
    } else if (props.commentId) {
      await store.takedownComment(props.commentId, event.data.reason)
    }
    toast.add({ title: isFeedback.value ? 'Feedback ditakedown' : 'Komentar ditakedown', color: 'success' })
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
            Takedown {{ isFeedback ? 'Feedback' : 'Komentar' }}
          </h3>
          <UButton v-if="!store.isSubmitting" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="emit('update:open', false)" />
        </div>

        <p class="mb-4 text-sm text-gray-500">
          Konten yang ditakedown akan disembunyikan dari publik. Anda dapat me-restore kapan saja.
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Alasan" name="reason">
            <UTextarea v-model="state.reason" :rows="3" placeholder="Alasan moderasi (wajib diisi)" />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" :disabled="store.isSubmitting" @click="emit('update:open', false)">Batal</UButton>
            <UButton type="submit" color="error" :loading="store.isSubmitting">Takedown</UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

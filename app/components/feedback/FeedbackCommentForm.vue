<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useFeedbackStore } from '~/stores/feedback'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  feedbackId: string
  replyToId?: string | null
  replyToName?: string | null
}>()

const emit = defineEmits<{
  done: []
}>()

const store = useFeedbackStore()
const toast = useToast()

const schema = z.object({
  body: z.string().trim().min(1, 'Komentar tidak boleh kosong').max(2000, 'Maksimal 2000 karakter'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ body: '' })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const payload = { body: event.data.body }
    if (props.replyToId) {
      ;(payload as any).reply_to_id = props.replyToId
    }
    await store.createComment(props.feedbackId, payload)
    state.body = ''
    toast.add({ title: 'Komentar berhasil ditambahkan', color: 'success' })
    emit('done')
  } catch (err) {
    toast.add({ title: 'Gagal menambahkan komentar', description: parseApiError(err), color: 'error' })
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
    <div v-if="replyToId" class="mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
      <span>
        <UIcon name="i-lucide-corner-up-left" class="mr-1 h-3.5 w-3.5" />
        Membalas <span class="font-medium text-teal-600 dark:text-teal-400">@{{ replyToName }}</span>
      </span>
      <UButton size="xs" variant="ghost" icon="i-lucide-x" square @click="emit('done')" />
    </div>

    <UForm :schema="schema" :state="state" class="space-y-3" @submit="onSubmit">
      <UFormField name="body">
        <UTextarea v-model="state.body" :rows="3" placeholder="Tulis komentar Anda..." class="w-full" />
      </UFormField>
      <div class="flex justify-end">
        <UButton type="submit" icon="i-lucide-send" :loading="store.isSubmitting">Kirim</UButton>
      </div>
    </UForm>
  </div>
</template>

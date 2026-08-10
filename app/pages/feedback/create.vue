<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useFeedbackStore } from '~/stores/feedback'
import { parseApiError } from '~/utils/errorParser'
import type { FeedbackCategory } from '#shared/types/Feedback'

definePageMeta({ layout: 'default' })

const store = useFeedbackStore()
const router = useRouter()
const toast = useToast()

const schema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter').max(200, 'Maksimal 200 karakter'),
  body: z.string().trim().min(3, 'Deskripsi minimal 3 karakter').max(5000, 'Maksimal 5000 karakter'),
  category: z.enum(['saran', 'pengaduan', 'pertanyaan', 'apresiasi', 'lainnya']),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  title: '',
  body: '',
  category: 'saran',
})

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const selectedFiles = ref<File[]>([])
const fileInput = ref<HTMLInputElement>()

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  target.value = ''
  if (!files) return

  for (const file of Array.from(files)) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.add({ title: `Format tidak didukung: ${file.name}`, color: 'error' })
      continue
    }
    if (file.size > MAX_SIZE) {
      toast.add({ title: `File terlalu besar: ${file.name}`, color: 'error' })
      continue
    }
    if (selectedFiles.value.length >= 5) {
      toast.add({ title: 'Maksimal 5 attachment', color: 'warning' })
      break
    }
    selectedFiles.value.push(file)
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const feedback = await store.createFeedback({
      title: event.data.title,
      body: event.data.body,
      category: event.data.category,
    })

    // Upload attachments one by one after feedback exists (presign needs feedback_id).
    for (const file of selectedFiles.value) {
      try {
        await store.uploadAttachment(feedback.id, file)
      } catch (err) {
        toast.add({ title: `Gagal mengunggah ${file.name}`, description: parseApiError(err), color: 'error' })
      }
    }

    toast.add({ title: 'Feedback berhasil dibuat', color: 'success' })
    router.push(`/feedback/${feedback.id}`)
  } catch (err) {
    toast.add({ title: 'Gagal membuat feedback', description: parseApiError(err), color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Buat Feedback</h1>
        <p class="mt-1 text-sm text-gray-500">Sampaikan umpan balik Anda kepada pengelola.</p>
      </div>
      <UButton variant="ghost" icon="i-lucide-arrow-left" to="/feedback">Kembali</UButton>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <UForm :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField label="Judul" name="title">
            <UInput v-model="state.title" placeholder="Ringkasan singkat feedback Anda" class="w-full" />
          </UFormField>

          <UFormField label="Kategori" name="category">
            <USelect
              v-model="state.category"
              :items="[
                { label: 'Saran', value: 'saran' },
                { label: 'Pengaduan', value: 'pengaduan' },
                { label: 'Pertanyaan', value: 'pertanyaan' },
                { label: 'Apresiasi', value: 'apresiasi' },
                { label: 'Lainnya', value: 'lainnya' },
              ]"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Deskripsi" name="body">
          <UTextarea v-model="state.body" :rows="6" placeholder="Tulis detail feedback Anda..." class="w-full" />
        </UFormField>

        <div>
          <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Lampiran <span class="font-normal text-gray-400">(opsional, maks 5)</span>
          </p>
          <input
            ref="fileInput"
            type="file"
            :accept="ALLOWED_TYPES.join(',')"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
          <UButton variant="soft" icon="i-lucide-paperclip" @click="openFilePicker">Pilih File</UButton>

          <ul v-if="selectedFiles.length > 0" class="mt-3 space-y-2">
            <li
              v-for="(file, index) in selectedFiles"
              :key="`${file.name}-${index}`"
              class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
            >
              <UIcon name="i-lucide-file" class="h-4 w-4 shrink-0 text-gray-400" />
              <span class="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">{{ file.name }}</span>
              <span class="text-xs text-gray-400">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
              <UButton variant="ghost" size="xs" icon="i-lucide-x" color="error" square @click="removeFile(index)" />
            </li>
          </ul>
        </div>

        <div class="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <UButton color="neutral" variant="ghost" :disabled="store.isSubmitting" to="/feedback">Batal</UButton>
          <UButton type="submit" icon="i-lucide-send" :loading="store.isSubmitting">Kirim</UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>

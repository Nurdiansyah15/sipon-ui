<script setup lang="ts">
import { useFeedbackStore } from '~/stores/feedback'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  feedbackId: string
}>()

const emit = defineEmits<{
  updated: []
}>()

const store = useFeedbackStore()
const toast = useToast()

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const isUploading = ref(false)
const fileInput = ref<HTMLInputElement>()

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.add({ title: 'Format tidak didukung', description: 'Gunakan gambar, PDF, teks, atau dokumen Word/Excel', color: 'error' })
    return
  }
  if (file.size > MAX_SIZE) {
    toast.add({ title: 'File terlalu besar', description: 'Maksimal 10MB', color: 'error' })
    return
  }

  isUploading.value = true
  try {
    await store.uploadAttachment(props.feedbackId, file)
    toast.add({ title: 'Attachment berhasil diunggah', color: 'success' })
    emit('updated')
  } catch (err) {
    toast.add({ title: 'Gagal mengunggah attachment', description: parseApiError(err), color: 'error' })
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      :accept="ALLOWED_TYPES.join(',')"
      class="hidden"
      @change="handleFileSelect"
    />
    <UButton
      variant="soft"
      icon="i-lucide-paperclip"
      :loading="isUploading"
      :disabled="store.isSubmitting"
      @click="openFilePicker"
    >
      Tambah Attachment
    </UButton>
  </div>
</template>

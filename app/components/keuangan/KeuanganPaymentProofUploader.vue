<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { parseApiError } from '~/utils/errorParser'

const model = defineModel<string | null>({ default: null })

const store = useKeuanganStore()
const toast = useToast()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const ALLOWED_EXT = '.jpg,.jpeg,.png,.webp,.pdf'
const MAX_SIZE = 5 * 1024 * 1024

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const fileName = ref<string | null>(null)
const previewUrl = ref<string | null>(null)

function selectFile() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.add({ title: 'Format tidak didukung', description: 'Gunakan JPG, PNG, WebP, atau PDF', color: 'error' })
    return
  }
  if (file.size > MAX_SIZE) {
    toast.add({ title: 'File terlalu besar', description: 'Maksimal 5MB', color: 'error' })
    return
  }

  uploading.value = true
  try {
    const { presign_url, key } = await store.requestPaymentProofPresign({
      filename: file.name,
      content_type: file.type,
    })

    const uploadRes = await fetch(presign_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!uploadRes.ok) throw new Error(`Upload gagal: ${uploadRes.status}`)

    model.value = key
    fileName.value = file.name
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    toast.add({ title: 'Bukti transfer berhasil diunggah', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal upload', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    uploading.value = false
    if (target) target.value = ''
  }
}

function removeFile() {
  model.value = null
  fileName.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function previewFile() {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <div class="space-y-3">
    <div
      class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900"
      :class="{ 'border-teal-500 dark:border-teal-500': model }"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
          <UIcon name="i-lucide-image-up" class="h-4.5 w-4.5 text-gray-400" />
        </div>
        <div class="min-w-0">
          <p v-if="fileName" class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ fileName }}</p>
          <p v-else class="text-sm text-gray-500 dark:text-gray-400">Belum ada bukti transfer</p>
          <p v-if="model" class="mt-0.5 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <UIcon name="i-lucide-check-circle" class="h-3.5 w-3.5" />
            Bukti siap dikirim
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <UButton
          v-if="previewUrl"
          variant="ghost"
          size="xs"
          icon="i-lucide-eye"
          @click="previewFile"
        >
          Lihat
        </UButton>
        <UButton
          v-if="model"
          variant="ghost"
          size="xs"
          color="error"
          icon="i-lucide-trash-2"
          @click="removeFile"
        />
        <UButton
          variant="soft"
          size="xs"
          icon="i-lucide-upload"
          :loading="uploading"
          @click="selectFile"
        >
          {{ model ? 'Ganti' : 'Upload' }}
        </UButton>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      :accept="ALLOWED_EXT"
      class="hidden"
      @change="handleFileSelect"
    />

    <p class="text-xs text-gray-400">JPG, PNG, WebP, PDF — Maks 5MB. Wajib diisi.</p>
  </div>
</template>

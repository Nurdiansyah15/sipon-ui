<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

const authStore = useAuthStore()
const toast = useToast()

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXT = '.jpg,.jpeg,.png,.webp,.gif'

const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const isUploading = ref(false)

const fileInput = ref<HTMLInputElement>()

function resetState() {
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  isUploading.value = false
}

function close() {
  resetState()
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (open) resetState()
  },
)

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.add({ title: 'Format tidak didukung', description: 'Gunakan JPG, PNG, WebP, atau GIF', color: 'error' })
    return
  }

  if (file.size > MAX_SIZE) {
    toast.add({ title: 'File terlalu besar', description: 'Maksimal 2MB', color: 'error' })
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function openFilePicker() {
  fileInput.value?.click()
}

async function upload() {
  if (!selectedFile.value) return

  isUploading.value = true
  try {
    const { presign_url, key } = await authStore.requestAvatarPresign(selectedFile.value.type)

    const uploadRes = await fetch(presign_url, {
      method: 'PUT',
      body: selectedFile.value,
      headers: { 'Content-Type': selectedFile.value.type },
    })

    if (!uploadRes.ok) {
      throw new Error(`Upload gagal: ${uploadRes.status}`)
    }

    await authStore.confirmAvatar(key)
    toast.add({ title: 'Foto profil berhasil diperbarui', color: 'success' })
    close()
  } catch (err) {
    toast.add({ title: 'Gagal mengupload foto', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isUploading" @update:open="(v: boolean) => !isUploading && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Foto Profil</h3>
          <UButton v-if="!isUploading" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <div class="space-y-4">
          <!-- Preview -->
          <div class="flex justify-center">
            <div class="relative">
              <UAvatar
                :src="previewUrl ?? authStore.user?.avatar_url ?? undefined"
                :alt="authStore.user?.fullname || authStore.user?.username || ''"
                size="3xl"
              />
              <button
                v-if="!isUploading"
                type="button"
                class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white shadow hover:bg-teal-700 transition"
                @click="openFilePicker"
              >
                <UIcon name="i-lucide-camera" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            {{ previewUrl ? 'Pratinjau foto baru' : (authStore.user?.avatar_url ? 'Foto saat ini' : 'Belum ada foto') }}
          </p>

          <input
            ref="fileInput"
            type="file"
            :accept="ALLOWED_EXT"
            class="hidden"
            @change="handleFileSelect"
          />

          <div class="flex justify-center gap-2">
            <UButton
              v-if="!previewUrl"
              variant="soft"
              @click="openFilePicker"
            >
              Pilih Foto
            </UButton>
            <UButton
              v-else
              variant="ghost"
              size="sm"
              icon="i-lucide-refresh-cw"
              :disabled="isUploading"
              @click="openFilePicker"
            >
              Pilih Ulang
            </UButton>
          </div>

          <p v-if="!previewUrl" class="text-center text-xs text-gray-400 dark:text-gray-500">
            JPG, PNG, WebP, GIF — Maks 2MB
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" :disabled="isUploading" @click="close">Batal</UButton>
            <UButton
              :disabled="!selectedFile"
              :loading="isUploading"
              @click="upload"
            >
              Upload
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

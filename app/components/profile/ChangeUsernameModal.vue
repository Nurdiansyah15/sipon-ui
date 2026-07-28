<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
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

const step = ref<'input' | 'confirm'>('input')
const isChecking = ref(false)
const isSaving = ref(false)
const isAvailable = ref<boolean | null>(null)
const usernameValue = ref('')

const schema = z.object({
  username: z
    .string()
    .min(3, 'Minimal 3 karakter')
    .max(30, 'Maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Hanya huruf, angka, dan underscore'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ username: '' })

function resetState() {
  state.username = ''
  usernameValue.value = ''
  isAvailable.value = null
  step.value = 'input'
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

const checkTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function onUsernameInput() {
  isAvailable.value = null
  if (checkTimer.value) clearTimeout(checkTimer.value)
  if (!state.username || state.username.length < 3) return
  checkTimer.value = setTimeout(() => {
    checkAvailability()
  }, 500)
}

async function checkAvailability() {
  isChecking.value = true
  try {
    const ok = await authStore.checkUsername(state.username!)
    isAvailable.value = ok
  } catch {
    isAvailable.value = null
  } finally {
    isChecking.value = false
  }
}

function goToConfirm() {
  if (isAvailable.value !== true) return
  usernameValue.value = state.username!
  step.value = 'confirm'
}

async function confirmChange() {
  isSaving.value = true
  try {
    await authStore.changeUsername({ username: usernameValue.value })
    toast.add({ title: 'Username berhasil diubah', color: 'success' })
    close()
  } catch (err) {
    toast.add({ title: 'Gagal mengubah username', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="step === 'input'" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Ganti Username</h3>
          <UButton v-if="step === 'input'" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <!-- Step 1: Input & check -->
        <div v-if="step === 'input'" class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Username saat ini: <span class="font-medium text-gray-900 dark:text-gray-100">{{ authStore.user?.username }}</span>
          </p>

          <UForm :schema="schema" :state="state" class="space-y-4">
            <UFormField label="Username Baru" name="username">
              <div class="flex gap-2">
                <UInput
                  v-model="state.username"
                  class="flex-1"
                  variant="subtle"
                  placeholder="username_baru"
                  @input="onUsernameInput"
                />
                <UButton
                  type="button"
                  variant="soft"
                  :loading="isChecking"
                  :disabled="!state.username || state.username.length < 3"
                  @click="checkAvailability"
                >
                  Cek
                </UButton>
              </div>
            </UFormField>
          </UForm>

          <!-- Availability status -->
          <div
            v-if="isAvailable === true"
            class="flex items-center gap-2 rounded bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
          >
            <UIcon name="i-lucide-circle-check" class="h-4 w-4" />
            Username tersedia
          </div>
          <div
            v-else-if="isAvailable === false"
            class="flex items-center gap-2 rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
          >
            <UIcon name="i-lucide-circle-x" class="h-4 w-4" />
            Username sudah digunakan
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" @click="close">Batal</UButton>
            <UButton :disabled="isAvailable !== true" @click="goToConfirm">
              Lanjut
            </UButton>
          </div>
        </div>

        <!-- Step 2: Confirm -->
        <div v-else class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Anda akan mengganti username menjadi:
          </p>
          <div class="rounded-lg bg-gray-50 p-3 text-center text-lg font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-100">
            {{ usernameValue }}
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Lanjutkan?
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="step = 'input'">Kembali</UButton>
            <UButton :loading="isSaving" color="success" @click="confirmChange">Ganti Username</UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

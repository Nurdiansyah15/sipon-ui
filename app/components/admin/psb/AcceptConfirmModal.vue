<script setup lang="ts">
import { usePsbAdminStore } from '~/stores/psbAdmin'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  open: boolean
  pendaftarId: string
  pendaftarName: string
  program?: string | null
  quota?: Record<string, number>
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  done: []
}>()

const store = usePsbAdminStore()
const toast = useToast()

const isSubmitting = ref(false)

async function confirm() {
  isSubmitting.value = true
  try {
    await store.accept(props.pendaftarId)
    toast.add({ title: 'Pendaftaran diterima', color: 'success' })
    emit('update:open', false)
    emit('done')
  } catch (err) {
    toast.add({ title: 'Gagal menerima', description: parseApiError(err), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Terima Pendaftaran</h3>
          <UButton v-if="!isSubmitting" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="emit('update:open', false)" />
        </div>

        <p class="text-sm text-gray-500">
          Anda akan menerima pendaftaran <strong>{{ pendaftarName }}</strong>.
          Pendaftar akan dapat melanjutkan ke tahap daftar ulang.
        </p>

        <div v-if="quota && program && quota[program] !== undefined" class="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-info" class="h-4 w-4 text-blue-500" />
            <span class="text-sm text-blue-700 dark:text-blue-300">
              Kuota {{ program }}: {{ quota[program] }} (informatif — tidak memblokir)
            </span>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="emit('update:open', false)">Batal</UButton>
          <UButton color="success" :loading="isSubmitting" @click="confirm">Terima</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { usePsbAdminStore } from '~/stores/psbAdmin'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  open: boolean
  pendaftarId: string
  pendaftarName: string
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
    const res = await store.generateNIS(props.pendaftarId)
    toast.add({ title: 'NIS berhasil digenerate', color: 'success' })
    emit('update:open', false)
    emit('done')
  } catch (err) {
    toast.add({ title: 'Gagal generate NIS', description: parseApiError(err), color: 'error' })
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Generate NIS</h3>
          <UButton v-if="!isSubmitting" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="emit('update:open', false)" />
        </div>

        <div class="rounded-lg bg-green-50 p-3 dark:bg-green-950">
          <p class="text-sm text-green-700 dark:text-green-300">
            Verifikasi daftar ulang <strong>{{ pendaftarName }}</strong> telah selesai.
            NIS akan digenerate otomatis dan pendaftar akan resmi menjadi santri.
          </p>
        </div>

        <p class="mt-4 text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>

        <div class="mt-6 flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="emit('update:open', false)">Batal</UButton>
          <UButton color="primary" :loading="isSubmitting" @click="confirm">Generate NIS</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

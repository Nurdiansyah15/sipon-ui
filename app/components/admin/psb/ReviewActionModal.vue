<script setup lang="ts">
import { usePsbAdminStore } from '~/stores/psbAdmin'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  open: boolean
  pendaftarId: string
  mode: 'request-revision' | 'reject' | 'request-revision-daftar-ulang'
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  done: []
}>()

const store = usePsbAdminStore()
const toast = useToast()

const notes = ref('')
const isSubmitting = ref(false)

const titleMap: Record<string, string> = {
  'request-revision': 'Minta Revisi',
  reject: 'Tolak Pendaftaran',
  'request-revision-daftar-ulang': 'Minta Revisi Daftar Ulang',
}

const descMap: Record<string, string> = {
  'request-revision': 'Minta pendaftar untuk merevisi data yang belum lengkap/sesuai. Pendaftar dapat mengajukan ulang setelah revisi.',
  reject: 'Tolak pendaftaran secara permanen. Pendaftar hanya bisa mendaftar lagi di periode berikutnya.',
  'request-revision-daftar-ulang': 'Minta pendaftar merevisi dokumen daftar ulang. Pendaftar dapat mengajukan ulang setelah revisi.',
}

function reset() {
  notes.value = ''
}

watch(() => props.open, (v) => { if (v) reset() })

async function submit() {
  isSubmitting.value = true
  try {
    const id = props.pendaftarId
    const n = notes.value || undefined
    if (props.mode === 'request-revision') await store.requestRevision(id, n)
    else if (props.mode === 'reject') await store.reject(id, n)
    else await store.requestRevisionDaftarUlang(id, n)

    toast.add({ title: 'Berhasil', color: 'success' })
    emit('update:open', false)
    emit('done')
  } catch (err) {
    toast.add({ title: 'Gagal', description: parseApiError(err), color: 'error' })
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ titleMap[mode] }}</h3>
          <UButton v-if="!isSubmitting" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="emit('update:open', false)" />
        </div>

        <p class="mb-4 text-sm text-gray-500">{{ descMap[mode] }}</p>

        <UFormField label="Catatan">
          <UTextarea v-model="notes" placeholder="Tulis catatan atau alasan (opsional)" :rows="3" />
        </UFormField>

        <div class="mt-6 flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="emit('update:open', false)">Batal</UButton>
          <UButton
            :color="mode === 'reject' ? 'error' : 'warning'"
            :loading="isSubmitting"
            @click="submit"
          >
            {{ mode === 'reject' ? 'Tolak' : 'Kirim' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

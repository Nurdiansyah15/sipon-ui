<script setup lang="ts">
import { usePsbSettingStore } from '~/stores/psbSetting'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  open: boolean
  settingId: string
  settingName: string
  purged: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  done: []
}>()

const store = usePsbSettingStore()
const toast = useToast()

const confirmText = ref('')
const isSubmitting = ref(false)
const canPurge = computed(() => !props.purged)

function reset() {
  confirmText.value = ''
}

watch(() => props.open, (v) => { if (v) reset() })

async function confirm() {
  if (confirmText.value !== props.settingName) return
  isSubmitting.value = true
  try {
    await store.purgePeriod(props.settingId)
    toast.add({ title: 'Data periode berhasil dihapus', color: 'success' })
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Hapus Data Periode</h3>
          <UButton v-if="!isSubmitting" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="emit('update:open', false)" />
        </div>

        <div v-if="!canPurge" class="rounded-lg bg-amber-50 p-3 dark:bg-amber-950">
          <p class="text-sm text-amber-700 dark:text-amber-300">Data periode ini sudah dihapus sebelumnya.</p>
        </div>

        <template v-else>
          <div class="rounded-lg bg-red-50 p-3 dark:bg-red-950">
            <p class="text-sm text-red-700 dark:text-red-300">
              Tindakan ini akan menghapus <strong>semua data pendaftar</strong> dan dokumen untuk periode ini secara permanen.
              Data periode sendiri akan tetap ada untuk histori laporan.
            </p>
          </div>

          <p class="mt-4 text-sm text-gray-500">
            Ketik <code class="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800">{{ settingName }}</code> untuk mengonfirmasi:
          </p>

          <UInput
            v-model="confirmText"
            class="mt-2"
            :placeholder="settingName"
          />
        </template>

        <div class="mt-6 flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="emit('update:open', false)">Batal</UButton>
          <UButton
            v-if="canPurge"
            color="error"
            :loading="isSubmitting"
            :disabled="confirmText !== settingName"
            @click="confirm"
          >
            Hapus Data
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

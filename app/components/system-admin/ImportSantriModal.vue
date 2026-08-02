<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { useKesantrianStore } from '~/stores/kesantrian'
import { parseApiError } from '~/utils/errorParser'
import type { ImportSantriResponse } from '#shared/types/Kesantrian'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  imported: []
}>()

const store = useKesantrianStore()
const toast = useToast()
const { copy, copied } = useClipboard()

const stage = ref<'form' | 'results'>('form')
const selectedFile = ref<File | null>(null)
const isDownloadingTemplate = ref(false)
const isImporting = ref(false)
const result = ref<ImportSantriResponse | null>(null)
const copiedRow = ref<number | null>(null)

const fileInput = ref<HTMLInputElement>()

function resetState() {
  stage.value = 'form'
  selectedFile.value = null
  result.value = null
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

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    toast.add({ title: 'Format tidak didukung', description: 'Gunakan file .xlsx', color: 'error' })
    return
  }

  selectedFile.value = file
}

async function downloadTemplate() {
  isDownloadingTemplate.value = true
  try {
    const blob = await store.downloadImportTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-import-santri.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    toast.add({
      title: 'Gagal mengunduh template',
      description: parseApiError(err, 'Terjadi kesalahan'),
      color: 'error',
    })
  } finally {
    isDownloadingTemplate.value = false
  }
}

async function submitImport() {
  if (!selectedFile.value) return

  isImporting.value = true
  try {
    const res = await store.importSantri(selectedFile.value)
    result.value = res
    stage.value = 'results'
    emit('imported')
    if (res.error_count === 0) {
      toast.add({ title: `${res.success_count} santri berhasil diimpor`, color: 'success' })
    } else {
      toast.add({
        title: `${res.success_count} berhasil, ${res.error_count} gagal`,
        description: 'Lihat detail per baris di bawah.',
        color: 'warning',
      })
    }
  } catch (err) {
    toast.add({
      title: 'Gagal mengimpor file',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isImporting.value = false
  }
}

function copyPassword(rowNumber: number, password: string) {
  copy(password)
  copiedRow.value = rowNumber
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Import Santri dari Excel</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <!-- Tahap 1: pilih & unggah file -->
        <div v-if="stage === 'form'" class="space-y-4">
          <UAlert
            icon="i-lucide-info"
            color="neutral"
            variant="subtle"
            title="Isi semua data santri kecuali dokumen"
            description="Unduh template, isi kolom NIS (wajib) dan data profil lainnya (opsional), lalu unggah kembali. Dokumen persyaratan tetap diunggah terpisah per santri."
          />

          <UButton
            variant="soft"
            icon="i-lucide-download"
            :loading="isDownloadingTemplate"
            @click="downloadTemplate"
          >
            Unduh Template
          </UButton>

          <div>
            <input ref="fileInput" type="file" accept=".xlsx" class="hidden" @change="handleFileSelect" />
            <div
              class="flex items-center justify-between rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700"
            >
              <div class="min-w-0">
                <p v-if="selectedFile" class="truncate text-sm text-gray-900 dark:text-gray-100">{{ selectedFile.name }}</p>
                <p v-else class="text-sm text-gray-500 dark:text-gray-400">Belum ada file dipilih</p>
              </div>
              <UButton variant="ghost" size="sm" icon="i-lucide-file-up" @click="openFilePicker">
                {{ selectedFile ? 'Ganti File' : 'Pilih File' }}
              </UButton>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="close">Batal</UButton>
            <UButton
              icon="i-lucide-upload"
              :disabled="!selectedFile"
              :loading="isImporting"
              @click="submitImport"
            >
              Import
            </UButton>
          </div>
        </div>

        <!-- Tahap 2: hasil import -->
        <div v-else-if="stage === 'results' && result" class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <UBadge color="success" variant="subtle">{{ result.success_count }} berhasil</UBadge>
            <UBadge v-if="result.error_count > 0" color="error" variant="subtle">{{ result.error_count }} gagal</UBadge>
          </div>

          <div class="max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700/50">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">Baris</th>
                  <th class="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">NIS</th>
                  <th class="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">Status</th>
                  <th class="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">Keterangan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="item in result.items" :key="item.row_number">
                  <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ item.row_number }}</td>
                  <td class="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">{{ item.nis }}</td>
                  <td class="px-3 py-2">
                    <UBadge :color="item.status === 'success' ? 'success' : 'error'" variant="subtle" size="sm">
                      {{ item.status === 'success' ? 'Berhasil' : 'Gagal' }}
                    </UBadge>
                  </td>
                  <td class="px-3 py-2">
                    <span v-if="item.status === 'error'" class="text-gray-700 dark:text-gray-300">{{ item.message }}</span>
                    <div v-else-if="item.generated_password" class="flex items-center gap-1">
                      <code class="font-mono text-xs">{{ item.generated_password }}</code>
                      <UButton
                        :icon="copied && copiedRow === item.row_number ? 'i-lucide-check' : 'i-lucide-copy'"
                        variant="ghost"
                        size="xs"
                        square
                        @click="copyPassword(item.row_number, item.generated_password!)"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <UAlert
            v-if="result.success_count > 0"
            icon="i-lucide-triangle-alert"
            color="warning"
            variant="subtle"
            description="Salin kata sandi santri yang berhasil dibuat sekarang — tidak akan ditampilkan lagi setelah jendela ini ditutup."
          />

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="soft" @click="stage = 'form'">Import File Lain</UButton>
            <UButton @click="close">Selesai</UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

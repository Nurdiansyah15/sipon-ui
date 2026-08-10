<script setup lang="ts">
import { usePersuratanStore } from '~/stores/persuratan'
import { useDokumenAsetStore } from '~/stores/dokumenAset'
import { usePermission } from '~/composables/usePermission'
import type { DokumenAsetDetail } from '#shared/types/DokumenAset'

definePageMeta({ layout: 'kesantrian' })

const route = useRoute()
const suratId = String(route.params.id)

const store = usePersuratanStore()
const dokumenStore = useDokumenAsetStore()
const toast = useToast()
const { can } = usePermission()

const dokumenMap = ref<Record<string, DokumenAsetDetail>>({})

const surat = computed(() => store.suratDetail)

async function loadDokumenDetails(ids: string[]) {
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const detail = await dokumenStore.fetchDetail(id)
        return [id, detail] as const
      } catch {
        return [id, null] as const
      }
    }),
  )
  dokumenMap.value = Object.fromEntries(entries.filter(([, d]) => d !== null)) as Record<string, DokumenAsetDetail>
}

async function loadDetail() {
  try {
    await store.fetchSuratDetail(suratId)
    const ids = store.suratDetail?.dokumen_aset_ids ?? []
    await loadDokumenDetails(ids)
  } catch {
    // error in store
  }
}

onMounted(loadDetail)

function formatDate(value: string) {
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

const pickerOpen = ref(false)
const linkedIds = computed(() => surat.value?.dokumen_aset_ids ?? [])

function onDokumenSelected(dokumenAsetId: string) {
  addDokumen(dokumenAsetId)
}

async function addDokumen(dokumenAsetId: string) {
  try {
    await store.addSuratDokumen(suratId, { dokumen_aset_id: dokumenAsetId })
    toast.add({ title: 'Dokumen berhasil ditautkan', color: 'success' })
    await loadDetail()
  } catch {
    toast.add({ title: 'Gagal menautkan dokumen', description: store.error ?? undefined, color: 'error' })
  }
}

const removeOpen = ref(false)
const removeTargetId = ref('')
const removeTargetLabel = ref('')

function openRemove(dokumenAsetId: string) {
  removeTargetId.value = dokumenAsetId
  removeTargetLabel.value = dokumenMap.value[dokumenAsetId]?.judul ?? dokumenAsetId
  removeOpen.value = true
}

async function confirmRemove() {
  try {
    await store.removeSuratDokumen(suratId, removeTargetId.value)
    removeOpen.value = false
    toast.add({ title: 'Dokumen berhasil dilepas', color: 'success' })
    await loadDetail()
  } catch {
    toast.add({ title: 'Gagal melepas dokumen', description: store.error ?? undefined, color: 'error' })
  }
}

async function handleDownload(dokumenAsetId: string) {
  const doc = dokumenMap.value[dokumenAsetId]
  try {
    const res = await store.getSuratDownload(suratId, dokumenAsetId)
    const filename = doc?.filename ?? `${surat.value?.nomor ?? 'surat'}.pdf`
    const a = document.createElement('a')
    a.href = res.access_url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch {
    toast.add({ title: 'Gagal membuat tautan unduh', color: 'error' })
  }
}

const deleteSuratOpen = ref(false)

async function confirmDeleteSurat() {
  try {
    await store.deleteSurat(suratId)
    toast.add({ title: 'Surat berhasil dihapus', color: 'success' })
    navigateTo('/admin/kesantrian/persuratan/surat')
  } catch {
    toast.add({ title: 'Gagal menghapus surat', description: store.error ?? undefined, color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-arrow-left"
        @click="navigateTo('/admin/kesantrian/persuratan/surat')"
      >
        Kembali ke Daftar Surat
      </UButton>
      <UButton
        v-if="can('manage_persuratan') && surat"
        color="error"
        variant="outline"
        icon="i-lucide-trash-2"
        @click="deleteSuratOpen = true"
      >
        Hapus Surat
      </UButton>
    </div>

    <div v-if="store.isLoading && !surat" class="flex justify-center py-20">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <template v-else-if="surat">
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Nomor Surat</p>
            <h1 class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ surat.nomor }}</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {{ surat.tipe_surat_nama }}
              <code class="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-teal-700 dark:bg-gray-800 dark:text-teal-400">
                {{ surat.tipe_surat_kode }}
              </code>
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Tanggal</p>
            <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ formatDate(surat.tanggal) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Dibuat</p>
            <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ formatDateTime(surat.created_at) }}</p>
          </div>
        </div>

        <div v-if="surat.keterangan" class="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Keterangan</p>
          <p class="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{{ surat.keterangan }}</p>
        </div>
      </div>

      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-gray-100">Dokumen Terkait</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ linkedIds.length }} dokumen tertaut pada surat ini.
            </p>
          </div>
          <UButton
            v-if="can('manage_persuratan')"
            icon="i-lucide-plus"
            size="sm"
            variant="outline"
            @click="pickerOpen = true"
          >
            Tautkan Dokumen
          </UButton>
        </div>

        <div v-if="linkedIds.length === 0" class="rounded-lg border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
          <UIcon name="i-lucide-file-x" class="mx-auto h-8 w-8 text-gray-400" />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Belum ada dokumen tertaut.</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="id in linkedIds"
            :key="id"
            class="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 dark:border-gray-800"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-50 dark:bg-teal-950">
              <UIcon name="i-lucide-file-text" class="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ dokumenMap[id]?.judul ?? id }}
              </p>
              <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ dokumenMap[id]?.filename ?? 'Memuat…' }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <UButton
                variant="ghost"
                size="sm"
                icon="i-lucide-download"
                color="neutral"
                class="text-gray-500"
                @click="handleDownload(id)"
              />
              <UButton
                v-if="can('manage_persuratan')"
                variant="ghost"
                size="sm"
                icon="i-lucide-unlink"
                color="neutral"
                class="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                @click="openRemove(id)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="rounded-lg border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
      <p class="text-sm text-gray-500 dark:text-gray-400">Surat tidak ditemukan.</p>
    </div>

    <AdminPersuratanDokumenPickerModal
      v-model:open="pickerOpen"
      :exclude-ids="linkedIds"
      @selected="onDokumenSelected"
    />

    <AdminConfirmActionModal
      v-model:open="removeOpen"
      title="Lepas Dokumen"
      :description="`Yakin ingin melepas dokumen '${removeTargetLabel}' dari surat ini?`"
      confirm-label="Lepas"
      color="error"
      :loading="store.isSubmitting"
      @confirm="confirmRemove"
    />

    <AdminConfirmActionModal
      v-model:open="deleteSuratOpen"
      title="Hapus Surat"
      :description="`Yakin ingin menghapus surat '${surat?.nomor}'? Nomor surat tidak akan dipakai ulang.`"
      confirm-label="Hapus"
      color="error"
      :loading="store.isSubmitting"
      @confirm="confirmDeleteSurat"
    />
  </div>
</template>

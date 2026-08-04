<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useDokumenAsetStore } from '~/stores/dokumenAset'
import { usePermission } from '~/composables/usePermission'
import type { DokumenAsetItem, DokumenAsetPresignResponse } from '#shared/types/DokumenAset'
import { KATEGORI_LABELS, KATEGORI_COLORS } from '#shared/types/DokumenAset'

definePageMeta({ layout: 'admin' })

const store = useDokumenAsetStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const search = ref('')
const kategoriFilter = ref<string>('all')
const viewMode = ref<'table' | 'grid'>('grid')

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
watch([page, limit, kategoriFilter], () => load())

async function load() {
  try {
    await store.fetchList({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
      kategori: kategoriFilter.value === 'all' ? undefined : kategoriFilter.value,
    })
  } catch {
    // error set in store
  }
}

onMounted(load)

const totalPages = computed(() => store.meta?.total_pages ?? 1)
const totalItems = computed(() => store.meta?.total ?? 0)

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function mimeIcon(mime: string) {
  if (mime.includes('pdf')) return 'i-lucide-file-text'
  if (mime.includes('word') || mime.includes('document')) return 'i-lucide-file-text'
  if (mime.includes('sheet') || mime.includes('excel')) return 'i-lucide-table'
  if (mime.includes('image')) return 'i-lucide-image'
  if (mime.includes('zip')) return 'i-lucide-file-archive'
  return 'i-lucide-file'
}

const columns: TableColumn<DokumenAsetItem>[] = [
  { accessorKey: 'judul', header: 'Judul' },
  { accessorKey: 'kategori', header: 'Kategori' },
  { accessorKey: 'filename', header: 'File' },
  { accessorKey: 'is_public', header: 'Akses' },
  { accessorKey: 'created_at', header: 'Dibuat' },
  { id: 'actions', header: 'Aksi' },
]

// ── Create Modal ───────────────────────────────────────────────────────────────
const createOpen = ref(false)
const createStep = ref(1)
const createJudul = ref('')
const createDeskripsi = ref('')
const createKategori = ref('lainnya')
const createIsPublic = ref(true)
const createFileInput = ref<HTMLInputElement | null>(null)
const createFile = ref<File | null>(null)
const createUploading = ref(false)
const createProgress = ref('')

function openCreate() {
  createStep.value = 1
  createJudul.value = ''
  createDeskripsi.value = ''
  createKategori.value = 'lainnya'
  createIsPublic.value = true
  createFile.value = null
  if (createFileInput.value) createFileInput.value.value = ''
  createUploading.value = false
  createProgress.value = ''
  createOpen.value = true
}

function createNext() {
  if (createStep.value === 1) {
    if (!createJudul.value.trim()) {
      toast.add({ title: 'Judul wajib diisi', color: 'warning' })
      return
    }
  }
  createStep.value++
}

function createPrev() {
  createStep.value--
}

function handleCreateFile() {
  createFile.value = createFileInput.value?.files?.[0] ?? null
}

async function doCreateUpload() {
  const file = createFile.value
  if (!file) {
    toast.add({ title: 'Pilih file terlebih dahulu', color: 'warning' })
    return
  }
  const allowed = [
    'image/jpeg', 'image/png', 'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
  ]
  if (!allowed.includes(file.type)) {
    toast.add({ title: 'Tipe file tidak didukung', color: 'error' })
    return
  }

  createUploading.value = true
  createProgress.value = 'Meminta presigned URL...'

  try {
    const presignRes = await store.requestPresign({
      content_type: file.type,
      filename: file.name,
      kategori: createKategori.value,
      deskripsi: createDeskripsi.value,
      is_public: createIsPublic.value,
    })

    createProgress.value = 'Mengunggah file...'
    await fetch(presignRes.presign_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })

    createProgress.value = 'Menyimpan...'
    await store.confirmUpload({
      key: presignRes.key,
      judul: createJudul.value,
      kategori: createKategori.value,
      deskripsi: createDeskripsi.value,
      original_filename: file.name,
      mime_type: file.type,
      size: file.size,
      is_public: createIsPublic.value,
    })

    createOpen.value = false
    toast.add({ title: 'Dokumen berhasil diunggah', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error || 'Gagal mengunggah dokumen', color: 'error' })
  } finally {
    createUploading.value = false
    createProgress.value = ''
  }
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
const editOpen = ref(false)
const editTarget = ref<DokumenAsetItem | null>(null)
const editJudul = ref('')
const editDeskripsi = ref('')
const editKategori = ref('')
const editIsPublic = ref(false)
const editSaving = ref(false)

function openEdit(row: DokumenAsetItem) {
  editTarget.value = row
  editJudul.value = row.judul
  editDeskripsi.value = row.deskripsi ?? ''
  editKategori.value = row.kategori
  editIsPublic.value = row.is_public
  editOpen.value = true
}

async function saveEdit() {
  if (!editTarget.value) return
  editSaving.value = true
  try {
    await store.update(editTarget.value.id, {
      judul: editJudul.value || undefined,
      deskripsi: editDeskripsi.value || undefined,
      kategori: editKategori.value || undefined,
      is_public: editIsPublic.value,
    })
    editOpen.value = false
    toast.add({ title: 'Dokumen berhasil diperbarui', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal memperbarui dokumen', color: 'error' })
  } finally {
    editSaving.value = false
  }
}

// ── Delete Modal ───────────────────────────────────────────────────────────────
const deleteOpen = ref(false)
const deleteTarget = ref<DokumenAsetItem | null>(null)
const deleteDeleting = ref(false)

function openDelete(row: DokumenAsetItem) {
  deleteTarget.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteDeleting.value = true
  try {
    await store.remove(deleteTarget.value.id)
    deleteOpen.value = false
    toast.add({ title: 'Dokumen berhasil dihapus', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal menghapus dokumen', color: 'error' })
  } finally {
    deleteDeleting.value = false
  }
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
const detailOpen = ref(false)
const detailItem = ref<DokumenAsetItem | null>(null)
const detailDownloadUrl = ref('')

async function openDetail(row: DokumenAsetItem) {
  detailItem.value = row
  detailDownloadUrl.value = ''
  detailOpen.value = true
  try {
    const res = await store.getDownloadUrl(row.id)
    detailDownloadUrl.value = res.access_url
  } catch {
    toast.add({ title: 'Gagal membuat tautan unduh', color: 'error' })
  }
}

async function handleDownload(row: DokumenAsetItem) {
  try {
    const res = await store.getDownloadUrl(row.id)
    downloadFile(res.access_url, row.filename)
  } catch {
    toast.add({ title: 'Gagal membuat tautan unduh', color: 'error' })
  }
}

function downloadFromDetail() {
  if (detailDownloadUrl.value && detailItem.value) {
    downloadFile(detailDownloadUrl.value, detailItem.value.filename)
  }
}

function downloadFile(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Row Actions ────────────────────────────────────────────────────────────────
function rowActions(row: DokumenAsetItem): DropdownMenuItem[] {
  return [
    { label: 'Lihat Detail', icon: 'i-lucide-eye', onSelect: () => openDetail(row) },
    { label: 'Download', icon: 'i-lucide-download', onSelect: () => handleDownload(row) },
    { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(row) },
    { label: 'Hapus', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDelete(row) },
  ]
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Dokumen Aset</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Kelola dokumen administratif untuk diunduh oleh pengguna.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800">
          <UButton
            :variant="viewMode === 'grid' ? 'solid' : 'ghost'"
            :color="viewMode === 'grid' ? 'primary' : 'neutral'"
            size="sm"
            icon="i-lucide-grid-3x3"
            @click="viewMode = 'grid'"
          />
          <UButton
            :variant="viewMode === 'table' ? 'solid' : 'ghost'"
            :color="viewMode === 'table' ? 'primary' : 'neutral'"
            size="sm"
            icon="i-lucide-list"
            @click="viewMode = 'table'"
          />
        </div>
        <UButton
          v-if="can('manage_dokumen')"
          icon="i-lucide-plus"
          color="primary"
          @click="openCreate"
        >
          Tambah Dokumen
        </UButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap gap-3">
      <UInput
        v-model="search"
        placeholder="Cari dokumen..."
        icon="i-lucide-search"
        class="w-full sm:w-64"
      />
      <USelect
        v-model="kategoriFilter"
        :items="[
          { label: 'Semua Kategori', value: 'all' },
          { label: 'Formulir', value: 'formulir' },
          { label: 'Surat', value: 'surat' },
          { label: 'Panduan', value: 'panduan' },
          { label: 'Brosur', value: 'brosur' },
          { label: 'Lainnya', value: 'lainnya' },
        ]"
        class="w-full sm:w-44"
      />
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <!-- Grid View -->
    <template v-else-if="viewMode === 'grid'">
      <div v-if="store.items.length === 0" class="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
        <UIcon name="i-lucide-folder-open" class="mx-auto h-12 w-12 text-gray-400" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Belum ada dokumen aset</p>
        <UButton
          v-if="can('manage_dokumen')"
          color="primary"
          variant="outline"
          class="mt-3"
          @click="openCreate"
        >
          Tambah Dokumen Pertama
        </UButton>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="item in store.items"
          :key="item.id"
          class="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-700/50 dark:bg-gray-900"
        >
          <div class="mb-3 flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                <UIcon :name="mimeIcon(item.mime_type)" class="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="KATEGORI_COLORS[item.kategori] || KATEGORI_COLORS.lainnya"
                >
                  {{ KATEGORI_LABELS[item.kategori] || item.kategori }}
                </span>
                <UBadge
                  v-if="item.is_public"
                  color="success"
                  variant="soft"
                  size="sm"
                >
                  Publik
                </UBadge>
                <UBadge
                  v-else
                  color="warning"
                  variant="soft"
                  size="sm"
                >
                  Private
                </UBadge>
              </div>
            </div>
            <UDropdownMenu :items="rowActions(item)" :content="{ align: 'end' }">
              <UButton
                variant="ghost"
                icon="i-lucide-ellipsis-vertical"
                size="sm"
                square
                class="text-gray-400 opacity-0 transition group-hover:opacity-100"
              />
            </UDropdownMenu>
          </div>

          <h3 class="mb-1 line-clamp-2 font-semibold text-gray-900 dark:text-gray-100">
            {{ item.judul }}
          </h3>

          <p v-if="item.deskripsi" class="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {{ item.deskripsi }}
          </p>

          <div class="mt-auto flex items-center justify-between pt-3 text-xs text-gray-400 dark:text-gray-500">
            <span>{{ item.filename }}</span>
            <span>{{ formatSize(item.size) }}</span>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(item.created_at) }}</span>
            <div class="flex gap-1">
              <UButton variant="ghost" size="xs" icon="i-lucide-download" color="neutral" class="text-gray-500" @click="handleDownload(item)" />
              <UButton variant="ghost" size="xs" icon="i-lucide-eye" color="neutral" class="text-gray-500" @click="openDetail(item)" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Table View -->
    <template v-else>
      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <UTable :columns="columns" :data="store.items" :loading="store.isLoading">
          <template #judul-cell="{ row }">
            <div class="flex items-center gap-2">
              <UIcon :name="mimeIcon(row.original.mime_type)" class="h-4 w-4 shrink-0 text-gray-400" />
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ row.original.judul }}</p>
            </div>
          </template>
          <template #kategori-cell="{ row }">
            <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="KATEGORI_COLORS[row.original.kategori] || KATEGORI_COLORS.lainnya">
              {{ KATEGORI_LABELS[row.original.kategori] || row.original.kategori }}
            </span>
          </template>
          <template #filename-cell="{ row }">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <p class="max-w-[200px] truncate">{{ row.original.filename }}</p>
              <p class="text-xs text-gray-400">{{ formatSize(row.original.size) }}</p>
            </div>
          </template>
          <template #is_public-cell="{ row }">
            <UBadge :color="row.original.is_public ? 'success' : 'warning'" variant="soft" size="sm">
              {{ row.original.is_public ? 'Publik' : 'Private' }}
            </UBadge>
          </template>
          <template #created_at-cell="{ row }">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.original.created_at) }}</span>
          </template>
          <template #actions-cell="{ row }">
            <AppRowActions :items="rowActions(row.original)" />
          </template>
        </UTable>
      </div>
    </template>

    <!-- Pagination -->
    <div v-if="totalItems > 0" class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Menampilkan {{ store.items.length }} dari {{ totalItems }} dokumen
      </p>
      <div class="flex items-center gap-2">
        <UButton variant="outline" size="sm" :disabled="page <= 1" @click="page--">Sebelumnya</UButton>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ page }} / {{ totalPages }}</span>
        <UButton variant="outline" size="sm" :disabled="page >= totalPages" @click="page++">Selanjutnya</UButton>
      </div>
    </div>
  </div>

  <!-- Create Modal -->
  <UModal v-model:open="createOpen" :dismissible="!createUploading">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tambah Dokumen Aset</h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            :disabled="createUploading"
            @click="createOpen = false"
          />
        </div>

        <!-- Stepper -->
        <div class="mb-6 flex items-center">
          <template v-for="(step, i) in [
            { label: 'Metadata', icon: 'i-lucide-file-text' },
            { label: 'Upload', icon: 'i-lucide-upload' },
          ]" :key="step.label">
            <div class="flex items-center gap-2 text-sm" :class="{ 'opacity-40': createStep < i + 1 }">
              <div
                class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                :class="createStep > i + 1
                  ? 'bg-teal-600 text-white'
                  : createStep === i + 1
                    ? 'border-2 border-teal-600 text-teal-600'
                    : 'border-2 border-gray-300 text-gray-400 dark:border-gray-600'"
              >
                {{ createStep > i + 1 ? '✓' : i + 1 }}
              </div>
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ step.label }}</span>
            </div>
            <div v-if="i < 1" class="mx-2 h-px w-8" :class="createStep > 1 ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'" />
          </template>
        </div>

        <!-- Step 1: Metadata -->
        <div v-if="createStep === 1" class="space-y-4">
          <UFormField label="Judul" required>
            <UInput v-model="createJudul" placeholder="Contoh: Formulir Pendaftaran 2026" />
          </UFormField>
          <UFormField label="Deskripsi">
            <UTextarea v-model="createDeskripsi" placeholder="Deskripsi singkat (opsional)" :rows="2" />
          </UFormField>
          <UFormField label="Kategori" required>
            <USelect
              v-model="createKategori"
              :items="[
                { label: 'Formulir', value: 'formulir' },
                { label: 'Surat', value: 'surat' },
                { label: 'Panduan', value: 'panduan' },
                { label: 'Brosur', value: 'brosur' },
                { label: 'Lainnya', value: 'lainnya' },
              ]"
            />
          </UFormField>
          <UFormField label="Akses Publik">
            <USwitch v-model="createIsPublic" class="mb-1" />
            <template #help>
              <span class="text-xs" :class="createIsPublic ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                {{ createIsPublic ? 'Dapat diakses siapa saja tanpa login' : 'Hanya dapat diakses pengguna yang sudah login' }}
              </span>
            </template>
          </UFormField>
          <div class="flex justify-end pt-2">
            <UButton color="primary" @click="createNext">
              Selanjutnya: Upload
              <UIcon name="i-lucide-arrow-right" class="ml-1 h-4 w-4" />
            </UButton>
          </div>
        </div>

        <!-- Step 2: Upload -->
        <div v-if="createStep === 2">
          <div
            class="cursor-pointer rounded-lg border-2 border-dashed py-10 text-center transition"
            :class="createFile
              ? 'border-teal-400 bg-teal-50 dark:border-teal-600 dark:bg-teal-950/30'
              : 'border-gray-300 hover:border-teal-400 dark:border-gray-600 dark:hover:border-teal-400'"
            @click="createFileInput?.click()"
          >
            <input ref="createFileInput" type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.zip" @change="handleCreateFile" />

            <template v-if="createFile">
              <UIcon name="i-lucide-file-check" class="mx-auto h-10 w-10 text-teal-600 dark:text-teal-400" />
              <p class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{{ createFile.name }}</p>
              <p class="text-xs text-gray-500">{{ formatSize(createFile.size) }}</p>
              <p class="mt-1 text-xs text-teal-600 dark:text-teal-400">Klik untuk ganti file</p>
            </template>
            <template v-else>
              <UIcon name="i-lucide-upload" class="mx-auto h-10 w-10 text-gray-400" />
              <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Klik untuk pilih file</p>
              <p class="text-xs text-gray-500">PDF, DOC/DOCX, XLS/XLSX, JPG, PNG, ZIP</p>
            </template>
          </div>

          <div class="mt-4 flex justify-between">
            <UButton variant="outline" :disabled="createUploading" @click="createPrev">
              <UIcon name="i-lucide-arrow-left" class="mr-1 h-4 w-4" />
              Kembali
            </UButton>
            <UButton color="primary" :loading="createUploading" :disabled="!createFile" @click="doCreateUpload">
              {{ createUploading ? createProgress || 'Mengunggah...' : 'Unggah Dokumen' }}
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Detail Modal -->
  <UModal v-model:open="detailOpen">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Detail Dokumen</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="detailOpen = false" />
        </div>

        <div v-if="detailItem" class="space-y-4">
          <div class="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <UIcon :name="mimeIcon(detailItem.mime_type)" class="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-gray-900 dark:text-gray-100">{{ detailItem.judul }}</p>
              <p class="text-sm text-gray-500">{{ detailItem.filename }}</p>
              <p class="text-xs text-gray-400">{{ formatSize(detailItem.size) }} &middot; {{ detailItem.mime_type }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="font-medium text-gray-500 dark:text-gray-400">Kategori</p>
              <p class="text-gray-900 dark:text-gray-100">{{ KATEGORI_LABELS[detailItem.kategori] || detailItem.kategori }}</p>
            </div>
            <div>
              <p class="font-medium text-gray-500 dark:text-gray-400">Akses</p>
              <UBadge :color="detailItem.is_public ? 'success' : 'warning'" variant="soft" size="sm">
                {{ detailItem.is_public ? 'Publik' : 'Private' }}
              </UBadge>
            </div>
            <div>
              <p class="font-medium text-gray-500 dark:text-gray-400">Dibuat</p>
              <p class="text-gray-900 dark:text-gray-100">{{ formatDate(detailItem.created_at) }}</p>
            </div>
            <div>
              <p class="font-medium text-gray-500 dark:text-gray-400">Diperbarui</p>
              <p class="text-gray-900 dark:text-gray-100">{{ formatDate(detailItem.updated_at) }}</p>
            </div>
          </div>

          <div v-if="detailItem.deskripsi">
            <p class="font-medium text-gray-500 dark:text-gray-400">Deskripsi</p>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ detailItem.deskripsi }}</p>
          </div>

          <UButton
            v-if="detailDownloadUrl"
            icon="i-lucide-download"
            color="primary"
            block
            @click="downloadFromDetail"
          >
            Download Dokumen
          </UButton>
          <UButton v-else icon="i-lucide-loader-circle" color="primary" block loading disabled>
            Menyiapkan tautan...
          </UButton>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Edit Modal -->
  <UModal v-model:open="editOpen">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Dokumen</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="editOpen = false" />
        </div>

        <div class="space-y-4">
          <UFormField label="Judul" required>
            <UInput v-model="editJudul" placeholder="Judul dokumen" />
          </UFormField>
          <UFormField label="Deskripsi">
            <UTextarea v-model="editDeskripsi" placeholder="Deskripsi (opsional)" :rows="2" />
          </UFormField>
          <UFormField label="Kategori" required>
            <USelect
              v-model="editKategori"
              :items="[
                { label: 'Formulir', value: 'formulir' },
                { label: 'Surat', value: 'surat' },
                { label: 'Panduan', value: 'panduan' },
                { label: 'Brosur', value: 'brosur' },
                { label: 'Lainnya', value: 'lainnya' },
              ]"
            />
          </UFormField>
          <UFormField label="Akses Publik">
            <USwitch v-model="editIsPublic" class="mb-1" />
            <template #help>
              <span class="text-xs">{{ editIsPublic ? 'Dapat diakses siapa saja tanpa login' : 'Hanya dapat diakses pengguna yang login' }}</span>
            </template>
          </UFormField>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="editSaving" @click="editOpen = false">Batal</UButton>
          <UButton color="primary" :loading="editSaving" @click="saveEdit">Simpan</UButton>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Delete Confirm Modal -->
  <AdminConfirmActionModal
    :open="deleteOpen"
    title="Hapus Dokumen"
    :description="`Yakin ingin menghapus dokumen '${deleteTarget?.judul ?? ''}'? Tindakan ini tidak dapat dibatalkan.`"
    confirm-label="Hapus"
    color="error"
    :loading="deleteDeleting"
    @update:open="deleteOpen = $event"
    @confirm="confirmDelete"
  />
</template>

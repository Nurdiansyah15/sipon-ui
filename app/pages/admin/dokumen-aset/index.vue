<script setup lang="ts">
import { z } from 'zod'
import type { TableColumn, DropdownMenuItem, FormSubmitEvent } from '@nuxt/ui'
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
const createFileInput = ref<HTMLInputElement | null>(null)
const createFile = ref<File | null>(null)
const createUploading = ref(false)
const createProgress = ref('')

const createSchema = z.object({
  judul: z.string().min(1, 'Judul wajib diisi'),
  deskripsi: z.string().nullable().optional(),
  kategori: z.string().min(1, 'Kategori wajib diisi'),
  is_public: z.boolean().optional(),
})
type CreateSchema = z.output<typeof createSchema>

const createState = reactive<Partial<CreateSchema>>({
  judul: '',
  deskripsi: null,
  kategori: 'lainnya',
  is_public: true,
})

function openCreate() {
  createState.judul = ''
  createState.deskripsi = null
  createState.kategori = 'lainnya'
  createState.is_public = true
  createFile.value = null
  if (createFileInput.value) createFileInput.value.value = ''
  createUploading.value = false
  createProgress.value = ''
  createOpen.value = true
}

function handleCreateFile() {
  createFile.value = createFileInput.value?.files?.[0] ?? null
}

async function doCreateUpload(event: FormSubmitEvent<CreateSchema>) {
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
      kategori: event.data.kategori,
      deskripsi: event.data.deskripsi || undefined,
      is_public: event.data.is_public ?? false,
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
      judul: event.data.judul,
      kategori: event.data.kategori,
      deskripsi: event.data.deskripsi || undefined,
      original_filename: file.name,
      mime_type: file.type,
      size: file.size,
      is_public: event.data.is_public ?? false,
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

        <UForm :schema="createSchema" :state="createState" class="space-y-4" @submit="doCreateUpload">
          <UFormField label="Judul" name="judul" required>
            <UInput v-model="createState.judul" class="w-full" placeholder="Contoh: Formulir Pendaftaran 2026" />
          </UFormField>

          <UFormField label="Kategori" name="kategori" required>
            <USelect
              v-model="createState.kategori"
              :items="[
                { label: 'Formulir', value: 'formulir' },
                { label: 'Surat', value: 'surat' },
                { label: 'Panduan', value: 'panduan' },
                { label: 'Brosur', value: 'brosur' },
                { label: 'Lainnya', value: 'lainnya' },
              ]"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Deskripsi" name="deskripsi">
            <UTextarea v-model="createState.deskripsi" class="w-full" placeholder="Deskripsi singkat (opsional)" :rows="2" />
          </UFormField>

          <UFormField label="File" required>
            <div class="space-y-2">
              <input ref="createFileInput" type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.zip" @change="handleCreateFile" />
              <UButton
                variant="outline"
                block
                icon="i-lucide-upload"
                class="w-full"
                :disabled="createUploading"
                @click="createFileInput?.click()"
              >
                {{ createFile ? createFile.name : 'Pilih File' }}
              </UButton>
              <p v-if="createFile" class="text-xs text-gray-500">{{ formatSize(createFile.size) }}</p>
              <p v-else class="text-xs text-gray-500">PDF, DOC/DOCX, XLS/XLSX, JPG, PNG, ZIP</p>
            </div>
          </UFormField>

          <UFormField label="Akses Publik" name="is_public">
            <USwitch v-model="createState.is_public" class="mb-1" />
            <template #help>
              <span class="text-xs" :class="createState.is_public ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                {{ createState.is_public ? 'Dapat diakses siapa saja tanpa login' : 'Hanya dapat diakses pengguna yang sudah login' }}
              </span>
            </template>
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" :disabled="createUploading" @click="createOpen = false">Batal</UButton>
            <UButton type="submit" :loading="createUploading" :disabled="!createFile">
              {{ createUploading ? createProgress || 'Mengunggah...' : 'Unggah Dokumen' }}
            </UButton>
          </div>
        </UForm>
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

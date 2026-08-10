<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { usePersuratanStore } from '~/stores/persuratan'
import { usePermission } from '~/composables/usePermission'
import { BULAN_OPTIONS } from '#shared/types/Persuratan'
import type { SuratItem, SuratDetail } from '#shared/types/Persuratan'

definePageMeta({ layout: 'kesantrian' })

const store = usePersuratanStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const search = ref('')
const tipeSuratFilter = ref<string>('all')
const bulanFilter = ref<string>('all')
const tahunFilter = ref<string>('all')

const currentYear = new Date().getFullYear()
const tahunOptions = [
  { label: 'Semua Tahun', value: 'all' },
  ...Array.from({ length: 6 }, (_, i) => ({ label: String(currentYear - i), value: String(currentYear - i) })),
]

const tipeSuratOptions = computed(() => [
  { label: 'Semua Tipe', value: 'all' },
  ...store.tipeSuratList.map((t) => ({ label: `${t.kode} - ${t.nama}`, value: t.id })),
])

const tipeSuratNameById = computed(() => {
  const map = new Map<string, string>()
  for (const t of store.tipeSuratList) map.set(t.id, `${t.kode} - ${t.nama}`)
  return map
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})

watch([page, limit, tipeSuratFilter, bulanFilter, tahunFilter], () => load())

async function load() {
  try {
    await store.fetchSuratList({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
      tipe_surat_id: tipeSuratFilter.value === 'all' ? undefined : tipeSuratFilter.value,
      bulan: bulanFilter.value === 'all' ? undefined : Number(bulanFilter.value),
      tahun: tahunFilter.value === 'all' ? undefined : Number(tahunFilter.value),
    })
  } catch {
    // error in store
  }
}

onMounted(async () => {
  await Promise.all([load(), store.fetchTipeSuratList()])
})

const totalPages = computed(() => store.suratMeta?.total_pages ?? 1)
const totalItems = computed(() => store.suratMeta?.total ?? 0)

function formatDate(value: string) {
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

const createOpen = ref(false)

function onCreateSuccess(detail: SuratDetail) {
  createOpen.value = false
  navigateTo(`/admin/kesantrian/persuratan/surat/${detail.id}`)
}

const deleteOpen = ref(false)
const deleteTarget = ref<SuratItem | null>(null)

function openDelete(row: SuratItem) {
  deleteTarget.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await store.deleteSurat(deleteTarget.value.id)
    deleteOpen.value = false
    toast.add({ title: 'Surat berhasil dihapus', color: 'success' })
    await load()
  } catch {
    toast.add({ title: 'Gagal menghapus surat', description: store.error ?? undefined, color: 'error' })
  }
}

function rowActions(row: SuratItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [
    {
      label: 'Lihat Detail',
      icon: 'i-lucide-eye',
      onSelect: () => navigateTo(`/admin/kesantrian/persuratan/surat/${row.id}`),
    },
  ]
  if (can('manage_persuratan')) {
    items.push({ type: 'separator' })
    items.push({ label: 'Hapus', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDelete(row) })
  }
  return items
}

const columns: TableColumn<SuratItem>[] = [
  { accessorKey: 'nomor', header: 'Nomor Surat' },
  { id: 'tipe_surat_id', header: 'Tipe' },
  { accessorKey: 'keterangan', header: 'Keterangan' },
  { accessorKey: 'tanggal', header: 'Tanggal' },
  { accessorKey: 'created_at', header: 'Dibuat' },
  { id: 'actions', header: '' },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Surat Keluar</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Pencatatan surat keluar dengan nomor otomatis dan tautan dokumen aset.
        </p>
      </div>
      <UButton
        v-if="can('manage_persuratan')"
        icon="i-lucide-plus"
        color="primary"
        @click="createOpen = true"
      >
        Buat Surat
      </UButton>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari nomor / keterangan…"
        class="w-full sm:w-72"
        :ui="{ base: 'bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500' }"
      />
      <USelect
        v-model="tipeSuratFilter"
        :items="tipeSuratOptions"
        class="w-56"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
      />
      <USelect
        v-model="bulanFilter"
        :items="[{ label: 'Semua Bulan', value: 'all' }, ...BULAN_OPTIONS.map((b) => ({ label: b.label, value: String(b.value) }))]"
        class="w-40"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
      />
      <USelect
        v-model="tahunFilter"
        :items="tahunOptions"
        class="w-36"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
      />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable :data="store.suratList" :columns="columns" :loading="store.isLoading" class="w-full">
        <template #nomor-cell="{ row }">
          <code class="text-sm font-semibold text-teal-700 dark:text-teal-400">{{ row.original.nomor }}</code>
        </template>

        <template #tipe_surat_id-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ tipeSuratNameById.get(row.original.tipe_surat_id) ?? '-' }}
          </span>
        </template>

        <template #keterangan-cell="{ row }">
          <span class="line-clamp-1 max-w-[280px] text-sm text-gray-600 dark:text-gray-400">
            {{ row.original.keterangan || '-' }}
          </span>
        </template>

        <template #tanggal-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.original.tanggal) }}</span>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div v-if="store.suratList.length === 0 && !store.isLoading" class="mt-4 rounded-lg border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
      <p class="text-sm text-gray-500 dark:text-gray-400">Belum ada surat yang dicatat.</p>
    </div>

    <div v-if="totalItems > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} surat · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :sibling-count="1"
        show-edges
      />
    </div>

    <AdminPersuratanSuratFormModal
      v-model:open="createOpen"
      @success="onCreateSuccess"
    />

    <AdminConfirmActionModal
      v-model:open="deleteOpen"
      title="Hapus Surat"
      :description="`Yakin ingin menghapus surat '${deleteTarget?.nomor}'? Nomor surat tidak akan dipakai ulang.`"
      confirm-label="Hapus"
      color="error"
      :loading="store.isSubmitting"
      @confirm="confirmDelete"
    />
  </div>
</template>

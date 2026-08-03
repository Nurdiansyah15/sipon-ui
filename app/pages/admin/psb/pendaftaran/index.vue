<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { usePsbAdminStore } from '~/stores/psbAdmin'
import type { ListPendaftarItem } from '#shared/types/Psb'

definePageMeta({ layout: 'psb' })

const store = usePsbAdminStore()
const router = useRouter()

const page = ref(1)
const limit = ref(10)
const statusFilter = ref('__semua__')
const settingFilter = ref('')

watch([page, limit, statusFilter, settingFilter], () => load(), { immediate: false })

async function load() {
  try {
    await store.fetchPendaftaranList({
      page: page.value,
      limit: limit.value,
      status: statusFilter.value !== '__semua__' ? statusFilter.value : undefined,
      psb_setting_id: settingFilter.value || undefined,
    })
  } catch {
    // error in store
  }
}

onMounted(load)

const columns: TableColumn<ListPendaftarItem>[] = [
  { accessorKey: 'program', header: 'Program' },
  { accessorKey: 'gender', header: 'L/P' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'nis', header: 'NIS' },
  { accessorKey: 'created_at', header: 'Tanggal' },
  { id: 'actions', header: '' },
]

const totalPages = computed(() => store.meta?.total_pages ?? 1)
const totalItems = computed(() => store.meta?.total ?? 0)

function formatDate(v: string) {
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusOptions = [
  { label: 'Semua', value: '__semua__' },
  { label: 'Draft', value: 'draft' },
  { label: 'Diajukan', value: 'diajukan' },
  { label: 'Perlu Revisi', value: 'perlu_revisi' },
  { label: 'Ditolak', value: 'ditolak' },
  { label: 'Diterima', value: 'diterima' },
  { label: 'Mengundurkan Diri', value: 'mengundurkan_diri' },
  { label: 'Daftar Ulang', value: 'daftar_ulang' },
  { label: 'Perlu Revisi DU', value: 'perlu_revisi_daftar_ulang' },
  { label: 'Selesai', value: 'selesai' },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Daftar Pendaftar</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Review pendaftaran santri baru, filter berdasarkan status, dan verifikasi dokumen.</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="mb-4 flex flex-wrap gap-2">
      <USelect v-model="statusFilter" :items="statusOptions" class="w-48" />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.items"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #program-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.original.program || '—' }}</span>
        </template>

        <template #gender-cell="{ row }">
          <span class="text-sm">{{ row.original.gender === '1' ? 'L' : 'P' }}</span>
        </template>

        <template #status-cell="{ row }">
          <PsbStatusBadge :status="row.original.status" size="sm" />
        </template>

        <template #nis-cell="{ row }">
          <code v-if="row.original.nis" class="text-sm">{{ row.original.nis }}</code>
          <span v-else class="text-xs text-gray-400">—</span>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-xs text-gray-500">{{ formatDate(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <UButton
            variant="ghost"
            size="xs"
            icon="i-lucide-eye"
            @click="router.push(`/admin/psb/pendaftaran/${row.original.id}`)"
          />
        </template>
      </UTable>
    </div>

    <!-- Pagination -->
    <div v-if="totalItems > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination v-model:page="page" :total="totalItems" :items-per-page="limit" :sibling-count="1" show-edges />
    </div>
  </div>
</template>

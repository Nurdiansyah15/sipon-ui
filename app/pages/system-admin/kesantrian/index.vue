<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKesantrianStore } from '~/stores/kesantrian'
import { usePermission } from '~/composables/usePermission'
import type { SantriItem } from '#shared/types/Kesantrian'

definePageMeta({ layout: 'system-admin' })

const store = useKesantrianStore()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const search = ref('')

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
watch([page, limit], () => load())

async function load() {
  try {
    await store.fetchSantriList({
      page: page.value,
      limit: limit.value,
      nis: search.value || undefined,
    })
  } catch (err) {
    // error sudah di-set ke store
  }
}

onMounted(load)

const createSantriOpen = ref(false)
const importSantriOpen = ref(false)

function rowActions(row: SantriItem): DropdownMenuItem[] {
  return [
    {
      label: 'Lihat Dokumen',
      icon: 'i-lucide-file-text',
      onSelect: () => navigateTo(`/system-admin/kesantrian/${row.id}`),
    },
  ]
}

const columns: TableColumn<SantriItem>[] = [
  { accessorKey: 'nis', header: 'NIS' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'fullname', header: 'Nama' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Dibuat' },
  { id: 'actions', header: 'Aksi' },
]

const totalPages = computed(() => store.santriListMeta?.total_pages ?? 1)
const totalItems = computed(() => store.santriListMeta?.total ?? 0)

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

function statusBadgeColor(status: string) {
  return status === 'ACTIVE' ? 'success' : 'error'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kelola Santri</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Daftar santri, buat profil santri baru berdasarkan NIS.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-inbox"
          @click="navigateTo('/system-admin/kesantrian/requests')"
        >
          Permintaan Santri
        </UButton>
        <UButton
          v-if="can('manage_santri')"
          color="neutral"
          variant="outline"
          icon="i-lucide-file-spreadsheet"
          @click="importSantriOpen = true"
        >
          Import Excel
        </UButton>
        <UButton
          v-if="can('manage_santri')"
          icon="i-lucide-plus"
          class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
          @click="createSantriOpen = true"
        >
          Buat Santri
        </UButton>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari NIS…"
        class="w-full sm:w-80"
        :ui="{ base: 'bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500' }"
      />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.santriList"
        :columns="columns"
        :loading="store.isLoadingSantri"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #nis-cell="{ row }">
          <span class="font-mono text-sm">{{ row.original.nis || '-' }}</span>
        </template>

        <template #fullname-cell="{ row }">
          {{ row.original.fullname || '-' }}
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusBadgeColor(row.original.status)" variant="subtle" size="sm">
            {{ row.original.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-xs text-gray-700 dark:text-gray-300">{{ formatDate(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} santri · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :sibling-count="1"
        show-edges
      >
        <template #item="{ item, page: curPage }">
          <UButton
            :color="curPage === item.value ? 'teal' : 'neutral'"
            :variant="curPage === item.value ? 'solid' : 'outline'"
            :label="String(item.value)"
            size="sm"
            :class="curPage === item.value ? 'bg-teal-600 text-white dark:bg-teal-500' : ''"
          />
        </template>
      </UPagination>
    </div>

    <!-- Modals -->
    <SystemAdminCreateSantriModal v-model:open="createSantriOpen" @created="load" />
    <SystemAdminImportSantriModal v-model:open="importSantriOpen" @imported="load" />
  </div>
</template>

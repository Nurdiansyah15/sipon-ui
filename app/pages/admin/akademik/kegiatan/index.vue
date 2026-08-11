<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { Activity } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const search = ref('')

watch([page, limit, search], () => load())

async function load() {
  try {
    await store.fetchActivities({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
    })
  } catch {
    // error in store
  }
}

onMounted(load)

const totalPages = computed(() => store.activitiesMeta?.total_pages ?? 1)
const totalItems = computed(() => store.activitiesMeta?.total ?? 0)

const columns: TableColumn<Activity>[] = [
  { accessorKey: 'code', header: 'Kode' },
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: '' },
]

const formOpen = ref(false)
const editTarget = ref<Activity | null>(null)

function openCreate() {
  editTarget.value = null
  formOpen.value = true
}

function openEdit(row: Activity) {
  editTarget.value = row
  formOpen.value = true
}

function rowActions(row: Activity): DropdownMenuItem[] {
  return [
    { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(row) },
  ]
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kegiatan</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Master kegiatan pesantren (Shalat Berjamaah, Kajian, Setoran Hafalan, dll).</p>
      </div>
      <UButton
        v-if="can('manage_akademik')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="openCreate"
      >
        Tambah Kegiatan
      </UButton>
    </div>

    <div class="mb-4 max-w-sm">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Cari kode / nama kegiatan" size="sm" class="w-full" />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.activities"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #code-cell="{ row }">
          <span class="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.code }}</span>
        </template>

        <template #status-cell="{ row }">
          <AkademikStatusBadge :status="row.original.status" type="activity" size="sm" />
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions v-if="can('manage_akademik')" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} kegiatan · hal. {{ page }} / {{ totalPages }}
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
            v-if="item.type === 'page'"
            :color="curPage === item.value ? 'primary' : 'neutral'"
            :variant="curPage === item.value ? 'solid' : 'outline'"
            :label="String(item.value)"
            size="sm"
          />
        </template>
      </UPagination>
    </div>

    <AdminAkademikActivityFormModal
      v-model:open="formOpen"
      :activity="editTarget"
      @success="load"
    />
  </div>
</template>

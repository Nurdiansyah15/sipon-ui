<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { SantriProgramListItem } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()
const { can } = usePermission()
const toast = useToast()

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
    await store.fetchSantriProgramList({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
    })
  } catch {
    // error sudah di-set ke store
  }
}

onMounted(load)

// ── Ubah program ─────────────────────────────────────────────────────────────
const assignOpen = ref(false)
const assignTarget = ref<{ id: string; name: string } | null>(null)

function openAssignProgram(row: SantriProgramListItem) {
  assignTarget.value = { id: row.santri_id, name: row.fullname || row.nis || row.santri_id }
  assignOpen.value = true
}

function rowActions(row: SantriProgramListItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (can('manage_akademik')) {
    items.push({
      label: 'Ubah Program',
      icon: 'i-lucide-graduation-cap',
      onSelect: () => openAssignProgram(row),
    })
  }
  return items
}

const columns: TableColumn<SantriProgramListItem>[] = [
  { accessorKey: 'nis', header: 'NIS' },
  { accessorKey: 'fullname', header: 'Nama' },
  { accessorKey: 'program', header: 'Program' },
  { id: 'actions', header: 'Aksi' },
]

const totalPages = computed(() => store.santriProgramListMeta?.total_pages ?? 1)
const totalItems = computed(() => store.santriProgramListMeta?.total ?? 0)

function programLabel(p?: { code: string; name: string } | null) {
  return p ? `${p.code} — ${p.name}` : '-'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kelola Program Santri</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Atur program aktif setiap santri dari module akademik.
      </p>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari NIS / nama…"
        class="w-full sm:w-80"
        :ui="{ base: 'bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500' }"
      />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.santriProgramList"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #nis-cell="{ row }">
          <span class="font-mono text-sm text-gray-900 dark:text-gray-100">{{ row.original.nis || '-' }}</span>
        </template>

        <template #fullname-cell="{ row }">
          <span class="text-sm text-gray-900 dark:text-gray-100">{{ row.original.fullname || '-' }}</span>
        </template>

        <template #program-cell="{ row }">
          <template v-if="row.original.program">
            <UBadge color="primary" variant="soft" size="sm">
              {{ programLabel(row.original.program) }}
            </UBadge>
          </template>
          <span v-else class="text-xs italic text-gray-500 dark:text-gray-400">Belum ada program</span>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div v-if="totalItems > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} santri · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :sibling-count="1"
        show-edges
      />
    </div>

    <AdminAkademikAssignProgramModal
      v-model:open="assignOpen"
      :santri-id="assignTarget?.id ?? ''"
      :santri-name="assignTarget?.name"
      @success="load"
    />
  </div>
</template>

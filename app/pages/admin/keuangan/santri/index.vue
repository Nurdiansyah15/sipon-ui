<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { useKesantrianStore } from '~/stores/kesantrian'
import { usePermission } from '~/composables/usePermission'
import type { SantriItem } from '#shared/types/Kesantrian'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const santriStore = useKesantrianStore()
const toast = useToast()
const { can } = usePermission()

const loading = ref(true)
const santriList = ref<SantriItem[]>([])

async function load() {
  loading.value = true
  try {
    await Promise.all([
      store.fetchBillingSchemes({ limit: 100 }),
      store.fetchAssignments(),
      santriStore.fetchSantriList({ limit: 100 }),
    ])
    santriList.value = santriStore.santriList
  } catch {
    toast.add({ title: 'Gagal memuat data', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(load)

const assignmentBySantriId = computed(() => {
  const map = new Map<string, typeof store.assignments[number]>()
  for (const a of store.assignments) {
    map.set(a.santri_id, a)
  }
  return map
})

function assignmentFor(santriId: string) {
  return assignmentBySantriId.value.get(santriId) ?? null
}

function schemeName(schemeId: string) {
  return store.billingSchemes.find((s) => s.id === schemeId)?.name ?? 'Skema tidak ditemukan'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const columns: TableColumn<SantriItem>[] = [
  { accessorKey: 'nis', header: 'NIS' },
  { accessorKey: 'fullname', header: 'Nama' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'current_scheme', header: 'Skema Aktif' },
  { id: 'actions', header: 'Aksi' },
]

const assignOpen = ref(false)
const selectedSantri = ref<SantriItem | null>(null)
const selectedAssignment = computed(() => selectedSantri.value ? assignmentFor(selectedSantri.value.id) : null)

function openAssign(santri?: SantriItem) {
  selectedSantri.value = santri || null
  assignOpen.value = true
}

function statusBadgeColor(status: string) {
  return status === 'ACTIVE' ? 'success' : 'error'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Penetapan Skema Santri</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Tetapkan skema tagihan ke santri beserta periode berlakunya.</p>
      </div>
      <UButton
        v-if="can('manage_keuangan')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="openAssign()"
      >
        Tetapkan Skema
      </UButton>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="santriList"
        :columns="columns"
        :loading="santriStore.isLoadingSantri"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #nis-cell="{ row }">
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.nis ?? '-' }}</span>
        </template>

        <template #fullname-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.original.fullname ?? row.original.username }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusBadgeColor(row.original.status)" variant="subtle" size="sm">
            {{ row.original.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>

        <template #current_scheme-cell="{ row }">
          <template v-if="assignmentFor(row.original.id)">
            <div class="flex flex-col gap-0.5">
              <UBadge color="success" variant="subtle" size="sm" class="w-fit">
                {{ schemeName(assignmentFor(row.original.id)!.billing_scheme_id) }}
              </UBadge>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                sejak {{ formatDate(assignmentFor(row.original.id)!.effective_from) }}
                <template v-if="assignmentFor(row.original.id)!.effective_until">
                  – {{ formatDate(assignmentFor(row.original.id)!.effective_until!) }}
                </template>
              </span>
            </div>
          </template>
          <UBadge v-else color="neutral" variant="subtle" size="sm">Belum ada skema</UBadge>
        </template>

        <template #actions-cell="{ row }">
          <UButton
            v-if="can('manage_keuangan')"
            variant="ghost"
            size="sm"
            :icon="assignmentFor(row.original.id) ? 'i-lucide-repeat' : 'i-lucide-user-check'"
            color="neutral"
            @click="openAssign(row.original)"
          >
            {{ assignmentFor(row.original.id) ? 'Ganti Skema' : 'Tetapkan Skema' }}
          </UButton>
        </template>
      </UTable>
    </div>

    <AdminKeuanganAdminAssignSchemeFormModal
      v-model:open="assignOpen"
      :schemes="store.billingSchemes"
      :santri-list="santriList"
      :selected-santri="selectedSantri"
      :current-assignment="selectedAssignment"
      @success="load"
    />
  </div>
</template>

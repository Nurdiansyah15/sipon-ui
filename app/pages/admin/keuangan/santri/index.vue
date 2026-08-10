<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { useKesantrianStore } from '~/stores/kesantrian'
import { usePermission } from '~/composables/usePermission'
import type { SantriItem } from '#shared/types/Kesantrian'
import type { SantriBillingAssignment } from '#shared/types/Keuangan'

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

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function isActive(a: SantriBillingAssignment) {
  // effective_until dihilangkan backend saat NULL (omitempty), jadi bisa
  // undefined maupun null — keduanya berarti masih berlangsung (tanpa batas).
  return a.effective_from <= todayStr() && (!a.effective_until || a.effective_until >= todayStr())
}

const assignmentsBySantriId = computed(() => {
  const map = new Map<string, SantriBillingAssignment[]>()
  for (const a of store.assignments) {
    const list = map.get(a.santri_id) ?? []
    list.push(a)
    map.set(a.santri_id, list)
  }
  for (const list of map.values()) {
    list.sort((x, y) => new Date(y.effective_from).getTime() - new Date(x.effective_from).getTime())
  }
  return map
})

function assignmentsFor(santriId: string) {
  return assignmentsBySantriId.value.get(santriId) ?? []
}

function currentAssignmentFor(santriId: string) {
  return assignmentsFor(santriId).find(isActive) ?? null
}

function schemeName(schemeId: string) {
  return store.billingSchemes.find((s) => s.id === schemeId)?.name ?? 'Skema tidak ditemukan'
}

function assignmentSchemeName(a: SantriBillingAssignment) {
  return a.billing_scheme?.name ?? schemeName(a.billing_scheme_id)
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
const assignMode = ref<'edit' | 'create'>('create')
const selectedSantri = ref<SantriItem | null>(null)
const selectedAssignment = computed(() => selectedSantri.value ? currentAssignmentFor(selectedSantri.value.id) : null)

function openEdit(santri: SantriItem) {
  selectedSantri.value = santri
  assignMode.value = 'edit'
  assignOpen.value = true
}

function openAssign(santri?: SantriItem) {
  selectedSantri.value = santri || null
  assignMode.value = 'create'
  assignOpen.value = true
}

const historyOpen = ref(false)
const historySantri = ref<SantriItem | null>(null)

function openHistory(santri: SantriItem) {
  historySantri.value = santri
  historyOpen.value = true
}

function rowActions(santri: SantriItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [
    { label: 'Tetapkan Skema', icon: 'i-lucide-user-check', onSelect: () => openAssign(santri) },
  ]
  if (currentAssignmentFor(santri.id)) {
    items.unshift({ label: 'Edit Skema', icon: 'i-lucide-pencil', onSelect: () => openEdit(santri) })
  }
  items.push({ label: 'Riwayat', icon: 'i-lucide-history', onSelect: () => openHistory(santri) })
  return items
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
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Tetapkan atau edit skema tagihan santri beserta periode berlakunya.</p>
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
          <template v-if="currentAssignmentFor(row.original.id)">
            <div class="flex flex-col gap-0.5">
              <UBadge color="success" variant="subtle" size="sm" class="w-fit">
                {{ assignmentSchemeName(currentAssignmentFor(row.original.id)!) }}
              </UBadge>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                sejak {{ formatDate(currentAssignmentFor(row.original.id)!.effective_from) }}
                <template v-if="currentAssignmentFor(row.original.id)!.effective_until">
                  – {{ formatDate(currentAssignmentFor(row.original.id)!.effective_until!) }}
                </template>
              </span>
            </div>
          </template>
          <UBadge v-else color="neutral" variant="subtle" size="sm">Belum ada skema</UBadge>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions v-if="can('manage_keuangan')" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <AdminKeuanganAdminAssignSchemeFormModal
      v-model:open="assignOpen"
      :schemes="store.billingSchemes"
      :santri-list="santriList"
      :selected-santri="selectedSantri"
      :current-assignment="selectedAssignment"
      :mode="assignMode"
      @success="load"
    />

    <AdminKeuanganAdminSantriSchemeHistoryModal
      v-model:open="historyOpen"
      :santri="historySantri"
      :assignments="historySantri ? assignmentsFor(historySantri.id) : []"
      :scheme-name="schemeName"
      :is-active="isActive"
    />
  </div>
</template>

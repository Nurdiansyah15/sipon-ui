<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { ProgramTransferRequest } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const statusFilter = ref<string>('pending')

watch([page, limit, statusFilter], () => load())
onMounted(load)

async function load() {
  try {
    await store.fetchProgramTransferRequests({
      page: page.value,
      limit: limit.value,
      status: statusFilter.value && statusFilter.value !== 'all' ? (statusFilter.value as never) : undefined,
    })
  } catch {
    // error sudah di-set ke store
  }
}

// ── Approve ──────────────────────────────────────────────────────────────────
const approveOpen = ref(false)
const approveTarget = ref<ProgramTransferRequest | null>(null)

function openApprove(row: ProgramTransferRequest) {
  approveTarget.value = row
  approveOpen.value = true
}

async function confirmApprove() {
  if (!approveTarget.value) return
  try {
    await store.approveProgramTransferRequest(approveTarget.value.id)
    toast.add({ title: 'Permintaan pindah program disetujui', color: 'success' })
    approveOpen.value = false
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal menyetujui permintaan', color: 'error' })
  }
}

// ── Reject ───────────────────────────────────────────────────────────────────
const rejectOpen = ref(false)
const rejectTarget = ref<ProgramTransferRequest | null>(null)
const rejectNotes = ref('')
const isRejecting = ref(false)

function openReject(row: ProgramTransferRequest) {
  rejectTarget.value = row
  rejectNotes.value = ''
  rejectOpen.value = true
}

async function confirmReject() {
  if (!rejectTarget.value) return
  isRejecting.value = true
  try {
    await store.rejectProgramTransferRequest(rejectTarget.value.id, rejectNotes.value || undefined)
    toast.add({ title: 'Permintaan pindah program ditolak', color: 'success' })
    rejectOpen.value = false
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal menolak permintaan', color: 'error' })
  } finally {
    isRejecting.value = false
  }
}

function rowActions(row: ProgramTransferRequest): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (row.status === 'pending' && can('manage_akademik')) {
    items.push({
      label: 'Setujui',
      icon: 'i-lucide-check',
      color: 'success',
      onSelect: () => openApprove(row),
    })
    items.push({
      label: 'Tolak',
      icon: 'i-lucide-x',
      color: 'error',
      onSelect: () => openReject(row),
    })
  }
  return items
}

const columns: TableColumn<ProgramTransferRequest>[] = [
  { accessorKey: 'santri_name', header: 'Santri' },
  { accessorKey: 'from_program', header: 'Program Asal' },
  { accessorKey: 'to_program', header: 'Program Tujuan' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'notes', header: 'Catatan' },
  { accessorKey: 'created_at', header: 'Diajukan' },
  { id: 'actions', header: 'Aksi' },
]

const totalPages = computed(() => store.programTransferRequestsMeta?.total_pages ?? 1)
const totalItems = computed(() => store.programTransferRequestsMeta?.total ?? 0)

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

function programLabel(p?: { code: string; name: string } | null) {
  return p ? `${p.code} — ${p.name}` : '-'
}

function statusBadgeColor(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

function statusLabel(status: string) {
  if (status === 'approved') return 'Disetujui'
  if (status === 'rejected') return 'Ditolak'
  return 'Menunggu'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Permintaan Pindah Program</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Tinjau, setujui, atau tolak permintaan santri untuk pindah program.
      </p>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <USelect
        v-model="statusFilter"
        :items="[
          { label: 'Semua status', value: 'all' },
          { label: 'Menunggu', value: 'pending' },
          { label: 'Disetujui', value: 'approved' },
          { label: 'Ditolak', value: 'rejected' },
        ]"
        class="w-44"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
      />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.programTransferRequests"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #santri_name-cell="{ row }">
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ row.original.santri_name || row.original.santri_id }}
          </span>
        </template>

        <template #from_program-cell="{ row }">
          <span class="text-xs text-gray-700 dark:text-gray-300">{{ programLabel(row.original.from_program) }}</span>
        </template>

        <template #to_program-cell="{ row }">
          <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ programLabel(row.original.to_program) }}</span>
        </template>

        <template #notes-cell="{ row }">
          <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.original.notes || '-' }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusBadgeColor(row.original.status)" variant="subtle" size="sm">
            {{ statusLabel(row.original.status) }}
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
        Total {{ totalItems }} permintaan · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :sibling-count="1"
        show-edges
      />
    </div>

    <!-- Modals -->
    <AdminConfirmActionModal
      v-model:open="approveOpen"
      title="Setujui Pindah Program"
      :description="approveTarget ? `Setujui ${approveTarget.santri_name || 'santri'} pindah dari ${programLabel(approveTarget.from_program)} ke ${programLabel(approveTarget.to_program)}?` : ''"
      confirm-label="Setujui"
      color="success"
      :loading="store.isSubmitting"
      @confirm="confirmApprove"
    />

    <AdminConfirmActionModal
      v-model:open="rejectOpen"
      title="Tolak Pindah Program"
      description="Berikan catatan alasan penolakan (opsional)."
      confirm-label="Tolak"
      confirm-color="error"
      :loading="isRejecting"
      @confirm="confirmReject"
    >
      <UTextarea v-model="rejectNotes" class="w-full" placeholder="Catatan (opsional)" :rows="3" />
    </AdminConfirmActionModal>
  </div>
</template>

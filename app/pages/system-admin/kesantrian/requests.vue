<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKesantrianStore } from '~/stores/kesantrian'
import { usePermission } from '~/composables/usePermission'
import type { SantriRequestItem } from '#shared/types/Kesantrian'

definePageMeta({ layout: 'system-admin' })

const store = useKesantrianStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const statusFilter = ref<string>('pending')

watch([page, limit, statusFilter], () => load())
onMounted(load)

async function load() {
  try {
    await store.fetchSantriRequests({
      page: page.value,
      limit: limit.value,
      status: statusFilter.value && statusFilter.value !== 'all' ? statusFilter.value : undefined,
    })
  } catch (err) {
    // error sudah di-set ke store
  }
}

// ── Approve modal ───────────────────────────────────────────────────────────
const approveOpen = ref(false)
const approveTargetId = ref('')
const approveTargetName = ref('')

function openApprove(row: SantriRequestItem) {
  approveTargetId.value = row.id
  approveTargetName.value = row.fullname || row.username
  approveOpen.value = true
}

// ── Reject modal ────────────────────────────────────────────────────────────
const rejectOpen = ref(false)
const rejectTargetId = ref('')
const rejectNotes = ref('')
const isRejecting = ref(false)

function openReject(row: SantriRequestItem) {
  rejectTargetId.value = row.id
  rejectNotes.value = ''
  rejectOpen.value = true
}

async function confirmReject() {
  isRejecting.value = true
  try {
    await store.rejectSantriRequest(rejectTargetId.value, { notes: rejectNotes.value || undefined })
    toast.add({ title: 'Permintaan santri ditolak', color: 'success' })
    rejectOpen.value = false
    await load()
  } catch (err) {
    toast.add({
      title: 'Gagal menolak permintaan',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isRejecting.value = false
  }
}

function rowActions(row: SantriRequestItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (row.status === 'pending' && can('manage_santri')) {
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

const columns: TableColumn<SantriRequestItem>[] = [
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'fullname', header: 'Nama' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'notes', header: 'Catatan' },
  { accessorKey: 'created_at', header: 'Diajukan' },
  { id: 'actions', header: 'Aksi' },
]

const totalPages = computed(() => store.requestsMeta?.total_pages ?? 1)
const totalItems = computed(() => store.requestsMeta?.total ?? 0)

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
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          size="sm"
          class="mb-2"
          @click="navigateTo('/system-admin/kesantrian')"
        >
          Kembali
        </UButton>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Permintaan Menjadi Santri</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Tinjau, setujui, atau tolak permintaan user untuk menjadi santri.</p>
      </div>
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
        :data="store.requests"
        :columns="columns"
        :loading="store.isLoadingRequests"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #fullname-cell="{ row }">
          {{ row.original.fullname || '-' }}
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
    <SystemAdminApproveSantriRequestModal
      v-model:open="approveOpen"
      :request-id="approveTargetId"
      :request-name="approveTargetName"
      @approved="load"
    />

    <SystemAdminConfirmActionModal
      v-model:open="rejectOpen"
      title="Tolak Permintaan Santri"
      description="Berikan catatan alasan penolakan (opsional)."
      confirm-label="Tolak"
      color="error"
      :loading="isRejecting"
      @confirm="confirmReject"
    >
      <UTextarea v-model="rejectNotes" class="w-full" placeholder="Catatan (opsional)" :rows="3" />
    </SystemAdminConfirmActionModal>
  </div>
</template>

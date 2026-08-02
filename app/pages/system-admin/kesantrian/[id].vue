<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKesantrianStore } from '~/stores/kesantrian'
import { usePermission } from '~/composables/usePermission'
import type { DokumenItem } from '#shared/types/Kesantrian'

definePageMeta({ layout: 'system-admin' })

const route = useRoute()
const store = useKesantrianStore()
const toast = useToast()
const { can } = usePermission()

const santriId = computed(() => String(route.params.id))

// Best-effort: kalau admin datang dari halaman list, cache-nya masih ada di
// store dan kita bisa tampilkan nama/NIS di header. Kalau diakses langsung
// lewat URL, cukup tampilkan ID santrinya saja.
const santriInfo = computed(() => store.santriList.find((s) => s.id === santriId.value))

const kindFilter = ref<string>('all')

watch(kindFilter, () => load())

async function load() {
  try {
    await store.fetchSantriDokumen(
      santriId.value,
      kindFilter.value && kindFilter.value !== 'all' ? kindFilter.value : undefined,
    )
  } catch (err) {
    toast.add({
      title: 'Gagal memuat dokumen santri',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

onMounted(load)

// ── Verify ──────────────────────────────────────────────────────────────────
const verifyOpen = ref(false)
const verifyTargetId = ref('')
const isVerifying = ref(false)

function openVerify(row: DokumenItem) {
  verifyTargetId.value = row.id
  verifyOpen.value = true
}

async function confirmVerify() {
  isVerifying.value = true
  try {
    await store.verifyDokumen(verifyTargetId.value)
    toast.add({ title: 'Dokumen berhasil diverifikasi', color: 'success' })
    verifyOpen.value = false
    await load()
  } catch (err) {
    toast.add({
      title: 'Gagal memverifikasi dokumen',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isVerifying.value = false
  }
}

// ── Reject ──────────────────────────────────────────────────────────────────
const rejectOpen = ref(false)
const rejectTargetId = ref('')
const rejectNotes = ref('')
const isRejecting = ref(false)

function openReject(row: DokumenItem) {
  rejectTargetId.value = row.id
  rejectNotes.value = ''
  rejectOpen.value = true
}

async function confirmReject() {
  isRejecting.value = true
  try {
    await store.rejectDokumen(rejectTargetId.value, { notes: rejectNotes.value || undefined })
    toast.add({ title: 'Dokumen berhasil ditolak', color: 'success' })
    rejectOpen.value = false
    await load()
  } catch (err) {
    toast.add({
      title: 'Gagal menolak dokumen',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isRejecting.value = false
  }
}

function rowActions(row: DokumenItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (row.status !== 'verified' && can('manage_santri')) {
    items.push({ label: 'Verifikasi', icon: 'i-lucide-check', color: 'success', onSelect: () => openVerify(row) })
  }
  if (row.status !== 'rejected' && can('manage_santri')) {
    items.push({ label: 'Tolak', icon: 'i-lucide-x', color: 'error', onSelect: () => openReject(row) })
  }
  return items
}

const kindLabels: Record<string, string> = {
  surat_pernyataan: 'Surat Pernyataan',
  ktp: 'KTP',
  kk: 'Kartu Keluarga',
  mutasi: 'Surat Mutasi',
  pembayaran: 'Bukti Pembayaran',
}

const columns: TableColumn<DokumenItem>[] = [
  { accessorKey: 'kind', header: 'Jenis Dokumen' },
  { accessorKey: 'original_filename', header: 'Nama Berkas' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Diunggah' },
  { id: 'actions', header: 'Aksi' },
]

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
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

function statusLabel(status: string) {
  if (status === 'verified') return 'Terverifikasi'
  if (status === 'rejected') return 'Ditolak'
  return 'Menunggu'
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6">
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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Dokumen Santri
        <span v-if="santriInfo" class="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
          ({{ santriInfo.fullname || santriInfo.username }} · NIS {{ santriInfo.nis || '-' }})
        </span>
      </h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Tinjau dan verifikasi berkas persyaratan yang diunggah santri.
      </p>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <USelect
        v-model="kindFilter"
        :items="[
          { label: 'Semua jenis', value: 'all' },
          { label: 'Surat Pernyataan', value: 'surat_pernyataan' },
          { label: 'KTP', value: 'ktp' },
          { label: 'Kartu Keluarga', value: 'kk' },
          { label: 'Surat Mutasi', value: 'mutasi' },
          { label: 'Bukti Pembayaran', value: 'pembayaran' },
        ]"
        class="w-52"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
      />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.dokumenList"
        :columns="columns"
        :loading="store.isLoadingDokumen"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #kind-cell="{ row }">
          {{ kindLabels[row.original.kind] || row.original.kind }}
        </template>

        <template #original_filename-cell="{ row }">
          <span class="text-xs text-gray-700 dark:text-gray-300">{{ row.original.original_filename || '-' }}</span>
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

    <!-- Modals -->
    <SystemAdminConfirmActionModal
      v-model:open="verifyOpen"
      title="Verifikasi Dokumen"
      description="Tandai dokumen ini sebagai terverifikasi?"
      confirm-label="Verifikasi"
      color="success"
      :loading="isVerifying"
      @confirm="confirmVerify"
    />

    <SystemAdminConfirmActionModal
      v-model:open="rejectOpen"
      title="Tolak Dokumen"
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

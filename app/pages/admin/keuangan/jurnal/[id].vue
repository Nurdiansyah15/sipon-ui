<script setup lang="ts">
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { usePermission } from '~/composables/usePermission'
import type { SourceType } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganAccountingStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { can } = usePermission()

const journalId = route.params.id as string
const isLoading = ref(true)
const cancelModalOpen = ref(false)

const sourceTypeLabels: Record<SourceType, string> = {
  invoice_issued: 'Invoice Diterbitkan',
  payment_verified: 'Pembayaran Terverifikasi',
  invoice_cancelled: 'Invoice Dibatalkan',
  adjustment: 'Penyesuaian',
  closing: 'Penutupan',
  manual: 'Manual',
}

const sourceInfo = computed(() => {
  const entry = store.currentJournalEntry
  if (!entry || !entry.source_type) return null

  if (entry.source_type === 'manual') return null

  return {
    type: sourceTypeLabels[entry.source_type],
    id: entry.source_id,
  }
})

const canCancel = computed(() => {
  const entry = store.currentJournalEntry
  if (!entry) return false
  return can('manage_journal') && entry.status === 'posted' && entry.source_type === 'manual'
})

const totalDebit = computed(() =>
  store.currentJournalEntry?.lines.reduce((sum, l) => sum + l.debit, 0) ?? 0
)

const totalCredit = computed(() =>
  store.currentJournalEntry?.lines.reduce((sum, l) => sum + l.credit, 0) ?? 0
)

async function load() {
  isLoading.value = true
  try {
    await store.fetchJournalEntry(journalId)
  } catch {
    toast.add({ title: 'Gagal memuat jurnal', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

function formatDate(v: string) {
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v).replace('Rp', 'Rp ')
}

function confirmCancel() {
  cancelModalOpen.value = true
}

async function handleCancel() {
  try {
    await store.cancelJournalEntry(journalId)
    toast.add({ title: 'Jurnal berhasil dibatalkan', color: 'success' })
    cancelModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal membatalkan jurnal', description: store.error || undefined, color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6">
      <UButton
        variant="ghost"
        size="sm"
        icon="i-lucide-arrow-left"
        @click="router.push('/admin/keuangan/jurnal')"
      >
        Kembali ke Daftar Jurnal
      </UButton>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
    </div>

    <div v-else-if="store.currentJournalEntry" class="space-y-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Jurnal {{ store.currentJournalEntry.journal_number }}
          </h1>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {{ store.currentJournalEntry.description }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <KeuanganStatusBadge :status="store.currentJournalEntry.status" type="journal" />
          <UButton
            v-if="canCancel"
            color="error"
            variant="soft"
            size="sm"
            icon="i-lucide-x-circle"
            @click="confirmCancel"
          >
            Batalkan
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">No. Jurnal</p>
          <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ store.currentJournalEntry.journal_number }}
          </p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tanggal</p>
          <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ formatDate(store.currentJournalEntry.entry_date) }}
          </p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Periode</p>
          <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ store.currentJournalEntry.period?.name || '—' }}
          </p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Sumber</p>
          <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ store.currentJournalEntry.source_type ? sourceTypeLabels[store.currentJournalEntry.source_type as SourceType] : 'Manual' }}
          </p>
        </div>
      </div>

      <div v-if="sourceInfo" class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-info" class="h-4 w-4 text-blue-500" />
          <p class="text-sm text-blue-700 dark:text-blue-300">
            Jurnal ini dibuat otomatis dari: <strong>{{ sourceInfo.type }}</strong>
            <span v-if="sourceInfo.id"> (ID: <code class="text-xs">{{ sourceInfo.id }}</code>)</span>
          </p>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <h3 class="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">
          Detail Jurnal
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Kode Akun</th>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nama Akun</th>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Keterangan</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Debit</th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Kredit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="line in store.currentJournalEntry.lines"
                :key="line.id"
                class="text-sm"
              >
                <td class="px-4 py-2.5">
                  <code class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ line.account_code }}</code>
                </td>
                <td class="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  {{ line.account?.name || '—' }}
                </td>
                <td class="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                  {{ line.description || '—' }}
                </td>
                <td class="px-4 py-2.5 text-right tabular-nums">
                  <span v-if="line.debit > 0" class="font-medium text-red-600 dark:text-red-400">
                    {{ formatRupiah(line.debit) }}
                  </span>
                  <span v-else class="text-gray-300">—</span>
                </td>
                <td class="px-4 py-2.5 text-right tabular-nums">
                  <span v-if="line.credit > 0" class="font-medium text-green-600 dark:text-green-400">
                    {{ formatRupiah(line.credit) }}
                  </span>
                  <span v-else class="text-gray-300">—</span>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 dark:bg-gray-800">
              <tr class="text-sm font-semibold">
                <td colspan="3" class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Total</td>
                <td class="px-4 py-3 text-right tabular-nums text-red-600 dark:text-red-400">
                  {{ formatRupiah(totalDebit) }}
                </td>
                <td class="px-4 py-3 text-right tabular-nums text-green-600 dark:text-green-400">
                  {{ formatRupiah(totalCredit) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-alert-circle" class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-2 text-sm text-gray-500">Jurnal tidak ditemukan</p>
      <UButton variant="ghost" size="sm" class="mt-3" @click="router.push('/admin/keuangan/jurnal')">
        Kembali
      </UButton>
    </div>

    <ConfirmActionModal
      v-model:open="cancelModalOpen"
      title="Batalkan Jurnal"
      message="Apakah Anda yakin ingin membatalkan jurnal ini? Tindakan ini akan membuat jurnal reversalan dan tidak dapat dibatalkan ulang."
      confirm-label="Batalkan"
      confirm-color="error"
      :loading="store.isSubmitting"
      @confirm="handleCancel"
    />
  </div>
</template>

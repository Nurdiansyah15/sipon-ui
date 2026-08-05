<script setup lang="ts">
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { usePermission } from '~/composables/usePermission'
import type { AccountingPeriod, PeriodStatus } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganAccountingStore()
const router = useRouter()
const toast = useToast()
const { can } = usePermission()

interface JournalLine {
  account_id: string | null
  description: string
  debit: number
  credit: number
}

const entryDate = ref('')
const description = ref('')
const periodId = ref<string>('')
const lines = ref<JournalLine[]>([{ account_id: null, description: '', debit: 0, credit: 0 }])

const periods = ref<AccountingPeriod[]>([])
const isSubmitting = ref(false)

const openPeriods = computed(() =>
  periods.value.filter(p => p.status === 'open' as PeriodStatus)
)

const periodOptions = computed(() =>
  openPeriods.value.map(p => ({ label: p.name, value: p.id }))
)

const totalDebit = computed(() =>
  lines.value.reduce((sum, l) => sum + (l.debit || 0), 0)
)

const totalCredit = computed(() =>
  lines.value.reduce((sum, l) => sum + (l.credit || 0), 0)
)

const difference = computed(() =>
  Math.abs(totalDebit.value - totalCredit.value)
)

const isBalanced = computed(() =>
  totalDebit.value === totalCredit.value && totalDebit.value > 0
)

const canSubmit = computed(() =>
  isBalanced.value && !!entryDate.value && !!description.value && !!periodId.value && can('manage_journal')
)

async function loadPeriods() {
  try {
    await store.fetchPeriods({ limit: 100 })
    periods.value = store.periods
  } catch {
    // ignore
  }
}

onMounted(loadPeriods)

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v).replace('Rp', 'Rp ')
}

async function handleSubmit() {
  if (!canSubmit.value) return

  isSubmitting.value = true
  try {
    const validLines = lines.value.filter(l => l.account_id && (l.debit > 0 || l.credit > 0))
    await store.createJournalEntry({
      entry_date: entryDate.value,
      description: description.value,
      period_id: periodId.value,
      lines: validLines.map(l => ({
        account_id: l.account_id!,
        description: l.description || undefined,
        debit: l.debit || 0,
        credit: l.credit || 0,
      })),
    })
    toast.add({ title: 'Jurnal berhasil dibuat', color: 'success' })
    router.push('/admin/keuangan/jurnal')
  } catch (err) {
    toast.add({ title: 'Gagal membuat jurnal', description: store.error || undefined, color: 'error' })
  } finally {
    isSubmitting.value = false
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

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Jurnal Manual</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Buat entri jurnal manual. Debit dan kredit harus seimbang sebelum dapat disimpan.
      </p>
    </div>

    <div class="space-y-6">
      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Informasi Jurnal</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <UFormField label="Tanggal" required>
            <UInput v-model="entryDate" type="date" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Periode" required>
            <USelect
              v-model="periodId"
              :items="periodOptions"
              value-key="value"
              placeholder="Pilih periode"
              variant="subtle"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Keterangan" required>
            <UInput v-model="description" placeholder="Keterangan jurnal" variant="subtle" class="w-full" />
          </UFormField>
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Baris Jurnal</h3>
        <KeuanganJournalLineEditor v-model="lines" />
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-6 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Total Debit: </span>
              <span class="font-semibold tabular-nums text-red-600 dark:text-red-400">{{ formatRupiah(totalDebit) }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Total Kredit: </span>
              <span class="font-semibold tabular-nums text-green-600 dark:text-green-400">{{ formatRupiah(totalCredit) }}</span>
            </div>
            <div v-if="difference > 0">
              <span class="text-gray-500 dark:text-gray-400">Selisih: </span>
              <span class="font-semibold tabular-nums text-orange-600 dark:text-orange-400">{{ formatRupiah(difference) }}</span>
            </div>
            <div v-else-if="totalDebit > 0" class="flex items-center gap-1 text-green-600 dark:text-green-400">
              <UIcon name="i-lucide-check-circle" class="h-4 w-4" />
              <span class="font-medium">Seimbang</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="outline"
              @click="router.push('/admin/keuangan/jurnal')"
            >
              Batal
            </UButton>
            <UButton
              color="primary"
              :loading="isSubmitting"
              :disabled="!canSubmit"
              @click="handleSubmit"
            >
              Simpan Jurnal
            </UButton>
          </div>
        </div>

        <p v-if="openPeriods.length === 0" class="mt-3 text-sm text-orange-600 dark:text-orange-400">
          Tidak ada periode yang buka. Buka periode akuntansi terlebih dahulu.
        </p>
      </div>
    </div>
  </div>
</template>

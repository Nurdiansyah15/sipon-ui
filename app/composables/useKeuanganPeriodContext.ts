import type { AccountingPeriod, BillingPeriod } from '#shared/types/Keuangan'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { useKeuanganStore } from '~/stores/keuangan'

/**
 * Konteks "periode kerja" untuk seluruh proses keuangan (transaksi,
 * akuntansi, laporan, dan periode tagihan).
 *
 * Periode akuntansi yang dipilih di-cache di localStorage sehingga bertahan
 * saat reload / pindah halaman, dan dipakai sebagai filter otomatis di semua
 * halaman yang berada di bawah periode akuntansi.
 */
const STORAGE_KEY = 'sipon-keuangan-working-period-id'

const OPERATIONAL_PREFIXES = [
  '/admin/keuangan/operasional',
  '/admin/keuangan/tagihan',
  '/admin/keuangan/pembayaran',
  '/admin/keuangan/jurnal',
  '/admin/keuangan/laporan',
  '/admin/keuangan/periode-tagihan',
]

export function useKeuanganPeriodContext() {
  const accountingStore = useKeuanganAccountingStore()
  const keuanganStore = useKeuanganStore()
  const route = useRoute()

  // Nilai dari payload SSR selalu null; nilai localStorage diterapkan setelah
  // mount di client (menghindari mismatch saat SSR hydration).
  const selectedPeriodId = useState<string | null>('keuangan-working-period-id', () => null)

  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored !== selectedPeriodId.value) {
      onMounted(() => {
        selectedPeriodId.value = stored
      })
    }
  }

  const selectedPeriod = computed<AccountingPeriod | null>(() => {
    if (!selectedPeriodId.value) return null
    return accountingStore.workPeriods.find(p => p.id === selectedPeriodId.value) ?? null
  })

  // Daftar periode akuntansi lengkap + opsi dropdown. Menggunakan `workPeriods`
  // (list terpisah dari `accountingStore.periods`) agar tidak kehilangan opsi
  // ketika halaman lain menimpa `periods` dengan daftar terfilter/halaman.
  const periods = computed(() => accountingStore.workPeriods)

  const periodOptions = computed(() =>
    periods.value.map(p => ({ label: `${p.name}`, value: p.id })),
  )

  // Jika periode tersimpan sudah tidak ada lagi (dihapus dari DB), bersihkan.
  watch(
    () => accountingStore.workPeriods,
    (list) => {
      if (list.length > 0 && selectedPeriodId.value && !list.some(p => p.id === selectedPeriodId.value)) {
        clearPeriod()
      }
    },
  )

  async function loadPeriods() {
    if (accountingStore.workPeriods.length === 0) {
      try { await accountingStore.fetchWorkPeriods() } catch { /* ignore */ }
    }
  }

  async function loadBillingPeriods() {
    try { await keuanganStore.fetchAllBillingPeriods(selectedPeriodId.value ?? undefined) } catch { /* ignore */ }
  }

  // Saat periode akuntansi berganti, segarkan daftar periode tagihan yang
  // masuk scope (relasi accounting_period_id).
  watch(selectedPeriodId, () => {
    loadBillingPeriods()
  })

  function setPeriod(id: string) {
    selectedPeriodId.value = id
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, id)
    }
  }

  function clearPeriod() {
    selectedPeriodId.value = null
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // True ketika berada di halaman yang dikontrol periode akuntansi
  // (bukan master data).
  const isOperasionalRoute = computed(() =>
    OPERATIONAL_PREFIXES.some(prefix => route.path === prefix || route.path.startsWith(prefix + '/')),
  )

  // Periode tagihan yang berada di bawah periode akuntansi terpilih (relasi
  // accounting_period_id). Dipakai untuk membatasi opsi filter di transaksi,
  // laporan, dan daftar periode tagihan.
  const billingPeriodsInScope = computed<BillingPeriod[]>(() => {
    const ap = selectedPeriod.value
    if (!ap) return []
    return keuanganStore.allBillingPeriods.filter(bp => bp.accounting_period_id === ap.id)
  })

  const billingPeriodInScopeOptions = computed(() =>
    billingPeriodsInScope.value.map(bp => ({ label: bp.name, value: bp.id })),
  )

  return {
    selectedPeriodId,
    selectedPeriod,
    periods,
    periodOptions,
    isOperasionalRoute,
    billingPeriodsInScope,
    billingPeriodInScopeOptions,
    loadPeriods,
    loadBillingPeriods,
    setPeriod,
    clearPeriod,
  }
}

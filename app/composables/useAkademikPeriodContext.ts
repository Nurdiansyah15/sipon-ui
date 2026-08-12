import type { AcademicPeriod } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'

/**
 * Konteks "periode kerja" untuk seluruh proses operasional akademik
 * (herregistrasi, aktivasi kegiatan, jadwal, sesi & absensi).
 *
 * Periode yang dipilih di-cache di localStorage sehingga bertahan saat
 * reload / pindah halaman, dan dipakai sebagai filter otomatis di semua
 * halaman operasional.
 */
const STORAGE_KEY = 'sipon-akademik-working-period-id'

const OPERATIONAL_PREFIXES = [
  '/admin/akademik/operasional',
  '/admin/akademik/herregistrasi',
  '/admin/akademik/aktivasi',
  '/admin/akademik/jadwal',
  '/admin/akademik/sesi',
]

export function useAkademikPeriodContext() {
  const store = useAkademikStore()
  const route = useRoute()

  // Nilai dari payload SSR selalu null; nilai localStorage diterapkan setelah
  // mount di client (menghindari mismatch saat SSR hydration).
  const selectedPeriodId = useState<string | null>('akademik-working-period-id', () => null)

  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored !== selectedPeriodId.value) {
      onMounted(() => {
        selectedPeriodId.value = stored
      })
    }
  }

  const selectedPeriod = computed<AcademicPeriod | null>(() => {
    if (!selectedPeriodId.value) return null
    return store.periods.find(p => p.id === selectedPeriodId.value) ?? null
  })

  // Jika periode tersimpan sudah tidak ada lagi (dihapus dari DB), bersihkan.
  watch(
    () => store.periods,
    (periods) => {
      if (periods.length > 0 && selectedPeriodId.value && !periods.some(p => p.id === selectedPeriodId.value)) {
        clearPeriod()
      }
    },
  )

  async function loadPeriods() {
    if (store.periods.length === 0) {
      try { await store.fetchPeriods({ limit: 100 }) } catch { /* ignore */ }
    }
  }

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

  // True ketika berada di halaman proses operasional (bukan master data).
  const isOperasionalRoute = computed(() =>
    OPERATIONAL_PREFIXES.some(prefix => route.path === prefix || route.path.startsWith(prefix + '/')),
  )

  return {
    selectedPeriodId,
    selectedPeriod,
    isOperasionalRoute,
    loadPeriods,
    setPeriod,
    clearPeriod,
  }
}

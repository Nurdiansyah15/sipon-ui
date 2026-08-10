import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { useArticleStore } from '~/stores/article'
import { useKesantrianStore } from '~/stores/kesantrian'
import { useKeuanganStore } from '~/stores/keuangan'
import { parseApiError } from '~/utils/errorParser'

interface DashboardState {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
}

export const useDashboardStore = defineStore('dashboard', {
  state: (): DashboardState => ({
    isLoaded: false,
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchAll() {
      this.isLoading = true
      this.error = null
      try {
        const articleStore = useArticleStore()
        const kesantrianStore = useKesantrianStore()
        const keuanganStore = useKeuanganStore()

        await Promise.all([
          articleStore.fetchList({
            page: 1,
            limit: 6,
            status: 'published',
            sort_by: 'published_at',
            sort_type: 'DESC',
          }),
          kesantrianStore.fetchMyProfile(),
          keuanganStore.fetchMyInvoiceSummary(),
        ])
        this.isLoaded = true
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat data dashboard.')
        throw err
      } finally {
        this.isLoading = false
      }
    },
  },
})

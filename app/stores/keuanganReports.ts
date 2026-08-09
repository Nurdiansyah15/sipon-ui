import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type {
  InvoiceSummary,
  OutstandingBySantri,
  LedgerResponse,
  TrialBalanceResponse,
  BalanceSheetResponse,
  IncomeStatementResponse,
} from '#shared/types/Keuangan'

interface KeuanganReportsState {
  summary: InvoiceSummary[]
  outstanding: OutstandingBySantri[]
  ledger: LedgerResponse | null
  trialBalance: TrialBalanceResponse | null
  balanceSheet: BalanceSheetResponse | null
  incomeStatement: IncomeStatementResponse | null
  isLoading: boolean
  error: string | null
}

export const useKeuanganReportsStore = defineStore('keuanganReports', {
  state: (): KeuanganReportsState => ({
    summary: [],
    outstanding: [],
    ledger: null,
    trialBalance: null,
    balanceSheet: null,
    incomeStatement: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchSummary(query: { billing_period_id?: string } = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<InvoiceSummary[]>>('/api/v1/web/keuangan/admin/reports/summary', {
          query: {
            billing_period_id: query.billing_period_id,
          },
        })
        this.summary = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat ringkasan tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchOutstanding(query: { billing_period_id?: string } = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<OutstandingBySantri[]>>(
          '/api/v1/web/keuangan/admin/reports/outstanding',
          {
            query: {
              billing_period_id: query.billing_period_id,
            },
          },
        )
        this.outstanding = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat tunggakan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchLedger(params: { account_id: string; period_id: string }) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<LedgerResponse>>('/api/v1/web/keuangan/admin/reports/ledger', {
          query: {
            account_id: params.account_id,
            period_id: params.period_id,
          },
        })
        this.ledger = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat buku besar.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchTrialBalance(params: { period_id: string }) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<TrialBalanceResponse>>(
          '/api/v1/web/keuangan/admin/reports/trial-balance',
          {
            query: {
              period_id: params.period_id,
            },
          },
        )
        this.trialBalance = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat neraca saldo.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchBalanceSheet(params: { as_of_date: string }) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<BalanceSheetResponse>>(
          '/api/v1/web/keuangan/admin/reports/balance-sheet',
          {
            query: {
              as_of_date: params.as_of_date,
            },
          },
        )
        this.balanceSheet = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat neraca.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchIncomeStatement(params: { period_id: string }) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<IncomeStatementResponse>>(
          '/api/v1/web/keuangan/admin/reports/income-statement',
          {
            query: {
              period_id: params.period_id,
            },
          },
        )
        this.incomeStatement = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat laporan laba rugi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.error = null
    },

    clearData() {
      this.summary = []
      this.outstanding = []
      this.ledger = null
      this.trialBalance = null
      this.balanceSheet = null
      this.incomeStatement = null
    },
  },
})

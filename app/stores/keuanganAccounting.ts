import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  Account,
  JournalEntry,
  AccountingPeriod,
  CreateAccountRequest,
  UpdateAccountRequest,
  CreateJournalEntryRequest,
  CreatePeriodRequest,
  AccountListQuery,
  JournalListQuery,
  PeriodListQuery,
} from '#shared/types/Keuangan'

interface KeuanganAccountingState {
  accounts: Account[]
  accountsMeta: ApiMeta | null
  currentAccount: Account | null
  journalEntries: JournalEntry[]
  journalEntriesMeta: ApiMeta | null
  currentJournalEntry: JournalEntry | null
  periods: AccountingPeriod[]
  periodsMeta: ApiMeta | null
  activePeriod: AccountingPeriod | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useKeuanganAccountingStore = defineStore('keuanganAccounting', {
  state: (): KeuanganAccountingState => ({
    accounts: [],
    accountsMeta: null,
    currentAccount: null,
    journalEntries: [],
    journalEntriesMeta: null,
    currentJournalEntry: null,
    periods: [],
    periodsMeta: null,
    activePeriod: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchAccounts(query: AccountListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Account[]>>('/api/v1/web/keuangan/admin/accounts', {
          query: {
            type: query.type,
            is_active: query.is_active,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.accounts = res.data
        this.accountsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar akun.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchAccount(id: string): Promise<Account> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Account>>(`/api/v1/web/keuangan/admin/accounts/${id}`)
        this.currentAccount = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail akun.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createAccount(payload: CreateAccountRequest): Promise<Account> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Account>>('/api/v1/web/keuangan/admin/accounts', payload)
        this.accounts.push(res.data)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat akun.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateAccount(id: string, payload: UpdateAccountRequest): Promise<Account> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<Account>>(`/api/v1/web/keuangan/admin/accounts/${id}`, payload)
        const idx = this.accounts.findIndex((a) => a.id === id)
        if (idx !== -1) this.accounts[idx] = res.data
        if (this.currentAccount?.id === id) this.currentAccount = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui akun.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteAccount(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/keuangan/admin/accounts/${id}`)
        this.accounts = this.accounts.filter((a) => a.id !== id)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus akun.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchJournalEntries(query: JournalListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<JournalEntry[]>>('/api/v1/web/keuangan/admin/journal-entries', {
          query: {
            period_id: query.period_id,
            status: query.status,
            source_type: query.source_type,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.journalEntries = res.data
        this.journalEntriesMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat jurnal.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchJournalEntry(id: string): Promise<JournalEntry> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<JournalEntry>>(`/api/v1/web/keuangan/admin/journal-entries/${id}`)
        this.currentJournalEntry = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail jurnal.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createJournalEntry(payload: CreateJournalEntryRequest): Promise<JournalEntry> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<JournalEntry>>(
          '/api/v1/web/keuangan/admin/journal-entries',
          payload,
        )
        this.journalEntries.unshift(res.data)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat jurnal.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async cancelJournalEntry(id: string): Promise<JournalEntry> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<JournalEntry>>(
          `/api/v1/web/keuangan/admin/journal-entries/${id}/cancel`,
        )
        const idx = this.journalEntries.findIndex((j) => j.id === id)
        if (idx !== -1) this.journalEntries[idx] = res.data
        if (this.currentJournalEntry?.id === id) this.currentJournalEntry = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membatalkan jurnal.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchPeriods(query: PeriodListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<AccountingPeriod[]>>('/api/v1/web/keuangan/admin/periods', {
          query: {
            status: query.status,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.periods = res.data
        this.periodsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat periode akuntansi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchActivePeriod() {
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<AccountingPeriod>>('/api/v1/web/keuangan/admin/periods/active')
        this.activePeriod = res.data
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.data?.status_code === 404) {
          this.activePeriod = null
        } else {
          this.error = parseApiError(err, 'Gagal memuat periode aktif.')
        }
      }
    },

    async createPeriod(payload: CreatePeriodRequest): Promise<AccountingPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<AccountingPeriod>>('/api/v1/web/keuangan/admin/periods', payload)
        this.periods.push(res.data)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat periode.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async closePeriod(id: string): Promise<AccountingPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<AccountingPeriod>>(
          `/api/v1/web/keuangan/admin/periods/${id}/close`,
        )
        const idx = this.periods.findIndex((p) => p.id === id)
        if (idx !== -1) this.periods[idx] = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menutup periode.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async reopenPeriod(id: string): Promise<AccountingPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<AccountingPeriod>>(
          `/api/v1/web/keuangan/admin/periods/${id}/reopen`,
        )
        const idx = this.periods.findIndex((p) => p.id === id)
        if (idx !== -1) this.periods[idx] = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuka kembali periode.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async lockPeriod(id: string): Promise<AccountingPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<AccountingPeriod>>(
          `/api/v1/web/keuangan/admin/periods/${id}/lock`,
        )
        const idx = this.periods.findIndex((p) => p.id === id)
        if (idx !== -1) this.periods[idx] = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengunci periode.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    clearError() {
      this.error = null
    },
  },
})

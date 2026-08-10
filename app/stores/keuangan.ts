import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  FeeComponent,
  BillingScheme,
  BillingPeriod,
  BillingBatch,
  BillingBatchDetail,
  Invoice,
  Payment,
  SantriBillingAssignment,
  MyInvoiceSummary,
  CreateFeeComponentRequest,
  UpdateFeeComponentRequest,
  CreateBillingSchemeRequest,
  UpdateBillingSchemeRequest,
  AddSchemeItemRequest,
  AssignSchemeRequest,
  UpdateAssignmentRequest,
  CreateInvoiceRequest,
  CreateInvoiceBatchRequest,
  CreateInvoiceBatchResponse,
  CreateBillingPeriodRequest,
  ApplyAdjustmentRequest,
  CreatePaymentRequest,
  FeeComponentListQuery,
  BillingSchemeListQuery,
  BillingPeriodListQuery,
  BillingBatchListQuery,
  InvoiceListQuery,
  PaymentListQuery,
} from '#shared/types/Keuangan'

interface KeuanganState {
  feeComponents: FeeComponent[]
  feeComponentsMeta: ApiMeta | null
  billingSchemes: BillingScheme[]
  billingSchemesMeta: ApiMeta | null
  billingPeriods: BillingPeriod[]
  billingPeriodsMeta: ApiMeta | null
  currentBillingPeriod: BillingPeriod | null
  billingBatches: BillingBatch[]
  billingBatchesMeta: ApiMeta | null
  currentBillingBatch: BillingBatchDetail | null
  assignments: SantriBillingAssignment[]
  invoices: Invoice[]
  invoicesMeta: ApiMeta | null
  currentInvoice: Invoice | null
  payments: Payment[]
  paymentsMeta: ApiMeta | null
  currentPayment: Payment | null
  myInvoiceSummary: MyInvoiceSummary | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useKeuanganStore = defineStore('keuangan', {
  state: (): KeuanganState => ({
    feeComponents: [],
    feeComponentsMeta: null,
    billingSchemes: [],
    billingSchemesMeta: null,
    billingPeriods: [],
    billingPeriodsMeta: null,
    currentBillingPeriod: null,
    billingBatches: [],
    billingBatchesMeta: null,
    currentBillingBatch: null,
    assignments: [],
    invoices: [],
    invoicesMeta: null,
    currentInvoice: null,
    payments: [],
    paymentsMeta: null,
    currentPayment: null,
    myInvoiceSummary: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchMyInvoices(query: InvoiceListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Invoice[]>>('/api/v1/web/keuangan/invoices', {
          query: {
            page: query.page ?? 1,
            limit: query.limit ?? 10,
            status: query.status,
            billing_period_id: query.billing_period_id,
          },
        })
        this.invoices = res.data
        this.invoicesMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchMyInvoice(id: string): Promise<Invoice> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Invoice>>(`/api/v1/web/keuangan/invoices/${id}`)
        this.currentInvoice = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchMyPayments(query: PaymentListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Payment[]>>('/api/v1/web/keuangan/payments', {
          query: {
            page: query.page ?? 1,
            limit: query.limit ?? 10,
            invoice_id: query.invoice_id,
            status: query.status,
          },
        })
        this.payments = res.data
        this.paymentsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar pembayaran.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchMyInvoiceSummary() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<MyInvoiceSummary>>('/api/v1/web/keuangan/summary')
        this.myInvoiceSummary = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat ringkasan tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchFeeComponents(query: FeeComponentListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<FeeComponent[]>>('/api/v1/web/keuangan/admin/components', {
          query: {
            page: query.page ?? 1,
            limit: query.limit ?? 10,
            is_active: query.is_active,
          },
        })
        this.feeComponents = res.data
        this.feeComponentsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat komponen biaya.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createFeeComponent(payload: CreateFeeComponentRequest): Promise<FeeComponent> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<FeeComponent>>('/api/v1/web/keuangan/admin/components', payload)
        this.feeComponents.push(res.data)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat komponen biaya.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateFeeComponent(id: string, payload: UpdateFeeComponentRequest): Promise<FeeComponent> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<FeeComponent>>(`/api/v1/web/keuangan/admin/components/${id}`, payload)
        const idx = this.feeComponents.findIndex((c) => c.id === id)
        if (idx !== -1) this.feeComponents[idx] = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui komponen biaya.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteFeeComponent(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/keuangan/admin/components/${id}`)
        this.feeComponents = this.feeComponents.filter((c) => c.id !== id)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus komponen biaya.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchBillingSchemes(query: BillingSchemeListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<BillingScheme[]>>('/api/v1/web/keuangan/admin/schemes', {
          query: {
            page: query.page ?? 1,
            limit: query.limit ?? 10,
            is_active: query.is_active,
          },
        })
        this.billingSchemes = res.data
        this.billingSchemesMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat skema tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchBillingScheme(id: string): Promise<BillingScheme> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<BillingScheme>>(`/api/v1/web/keuangan/admin/schemes/${id}`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail skema tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createBillingScheme(payload: CreateBillingSchemeRequest): Promise<BillingScheme> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<BillingScheme>>('/api/v1/web/keuangan/admin/schemes', payload)
        this.billingSchemes.push(res.data)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat skema tagihan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateBillingScheme(id: string, payload: UpdateBillingSchemeRequest): Promise<BillingScheme> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<BillingScheme>>(`/api/v1/web/keuangan/admin/schemes/${id}`, payload)
        const idx = this.billingSchemes.findIndex((s) => s.id === id)
        if (idx !== -1) this.billingSchemes[idx] = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui skema tagihan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteBillingScheme(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/keuangan/admin/schemes/${id}`)
        this.billingSchemes = this.billingSchemes.filter((s) => s.id !== id)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus skema tagihan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchBillingPeriods(query: BillingPeriodListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<BillingPeriod[]>>('/api/v1/web/keuangan/admin/billing-periods', {
          query: {
            status: query.status,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.billingPeriods = res.data
        this.billingPeriodsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat periode tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchBillingPeriod(id: string): Promise<BillingPeriod> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<BillingPeriod>>(`/api/v1/web/keuangan/admin/billing-periods/${id}`)
        this.currentBillingPeriod = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail periode tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createBillingPeriod(payload: CreateBillingPeriodRequest): Promise<BillingPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<BillingPeriod>>('/api/v1/web/keuangan/admin/billing-periods', payload)
        this.billingPeriods.push(res.data)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat periode tagihan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async openBillingPeriod(id: string): Promise<BillingPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<BillingPeriod>>(
          `/api/v1/web/keuangan/admin/billing-periods/${id}/open`,
        )
        const idx = this.billingPeriods.findIndex((p) => p.id === id)
        if (idx !== -1) this.billingPeriods[idx] = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuka periode tagihan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async closeBillingPeriod(id: string): Promise<BillingPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<BillingPeriod>>(
          `/api/v1/web/keuangan/admin/billing-periods/${id}/close`,
        )
        const idx = this.billingPeriods.findIndex((p) => p.id === id)
        if (idx !== -1) this.billingPeriods[idx] = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menutup periode tagihan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async addSchemeItem(schemeId: string, payload: AddSchemeItemRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<BillingScheme>>(
          `/api/v1/web/keuangan/admin/schemes/${schemeId}/items`,
          payload,
        )
        const idx = this.billingSchemes.findIndex((s) => s?.id === schemeId)
        if (idx !== -1) this.billingSchemes[idx] = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menambahkan item skema.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async removeSchemeItem(schemeId: string, itemId: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.delete<ApiSuccess<BillingScheme>>(
          `/api/v1/web/keuangan/admin/schemes/${schemeId}/items/${itemId}`,
        )
        const idx = this.billingSchemes.findIndex((s) => s?.id === schemeId)
        if (idx !== -1) this.billingSchemes[idx] = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus item skema.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async assignSchemeToSantri(payload: AssignSchemeRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post('/api/v1/web/keuangan/admin/assignments', payload)
        await this.fetchAssignments()
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menetapkan skema ke santri.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchAssignments(santriId?: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SantriBillingAssignment[]>>('/api/v1/web/keuangan/admin/assignments', {
          query: santriId ? { santri_id: santriId } : undefined,
        })
        this.assignments = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat penetapan skema.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async updateAssignment(id: string, payload: UpdateAssignmentRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put(`/api/v1/web/keuangan/admin/assignments/${id}`, payload)
        await this.fetchAssignments()
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui penetapan skema.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchInvoices(query: InvoiceListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Invoice[]>>('/api/v1/web/keuangan/admin/invoices', {
          query: {
            santri_id: query.santri_id,
            user_id: query.user_id,
            status: query.status,
            billing_period_id: query.billing_period_id,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.invoices = res.data
        this.invoicesMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createInvoice(payload: CreateInvoiceRequest): Promise<Invoice> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Invoice>>('/api/v1/web/keuangan/admin/invoices', payload)
        this.invoices.unshift(res.data)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat tagihan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async createInvoiceBatch(payload: CreateInvoiceBatchRequest): Promise<CreateInvoiceBatchResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<CreateInvoiceBatchResponse>>(
          '/api/v1/web/keuangan/admin/invoices/batch',
          payload,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat tagihan massal.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchBillingBatches(query: BillingBatchListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<BillingBatch[]>>('/api/v1/web/keuangan/admin/billing-batches', {
          query: {
            status: query.status,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.billingBatches = res.data
        this.billingBatchesMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat riwayat batch tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchBillingBatch(id: string): Promise<BillingBatchDetail> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<BillingBatchDetail>>(`/api/v1/web/keuangan/admin/billing-batches/${id}`)
        this.currentBillingBatch = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail batch tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchInvoice(id: string): Promise<Invoice> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Invoice>>(`/api/v1/web/keuangan/admin/invoices/${id}`)
        this.currentInvoice = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail tagihan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async cancelInvoice(id: string): Promise<Invoice> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Invoice>>(`/api/v1/web/keuangan/admin/invoices/${id}/cancel`)
        const idx = this.invoices.findIndex((i) => i.id === id)
        if (idx !== -1) this.invoices[idx] = res.data
        if (this.currentInvoice?.id === id) this.currentInvoice = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membatalkan tagihan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async applyAdjustment(id: string, payload: ApplyAdjustmentRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Invoice>>(
          `/api/v1/web/keuangan/admin/invoices/${id}/adjustment`,
          payload,
        )
        const idx = this.invoices.findIndex((i) => i.id === id)
        if (idx !== -1) this.invoices[idx] = res.data
        if (this.currentInvoice?.id === id) this.currentInvoice = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menerapkan penyesuaian.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchPayments(query: PaymentListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Payment[]>>('/api/v1/web/keuangan/admin/payments', {
          query: {
            invoice_id: query.invoice_id,
            status: query.status,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.payments = res.data
        this.paymentsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar pembayaran.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchPayment(id: string): Promise<Payment> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Payment>>(`/api/v1/web/keuangan/admin/payments/${id}`)
        this.currentPayment = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail pembayaran.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async downloadReceipt(id: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get(`/api/v1/web/keuangan/admin/payments/${id}/receipt`, {
          responseType: 'blob',
        })
        return res
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengunduh kwitansi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createManualPayment(payload: CreatePaymentRequest): Promise<Payment> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Payment>>('/api/v1/web/keuangan/admin/payments/manual', payload)
        this.payments.unshift(res.data)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat pembayaran manual.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async verifyPayment(id: string): Promise<Payment> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Payment>>(`/api/v1/web/keuangan/admin/payments/${id}/verify`)
        const idx = this.payments.findIndex((p) => p.id === id)
        if (idx !== -1) this.payments[idx] = res.data
        if (this.currentPayment?.id === id) this.currentPayment = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memverifikasi pembayaran.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async rejectPayment(id: string): Promise<Payment> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Payment>>(`/api/v1/web/keuangan/admin/payments/${id}/reject`)
        const idx = this.payments.findIndex((p) => p.id === id)
        if (idx !== -1) this.payments[idx] = res.data
        if (this.currentPayment?.id === id) this.currentPayment = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menolak pembayaran.')
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

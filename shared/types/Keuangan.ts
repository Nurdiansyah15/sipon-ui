// Enums
export type PeriodType = 'monthly' | 'semesterly' | 'yearly' | 'once' | 'weekly'
export type InvoiceStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'expired' | 'cancelled'
export type PaymentStatus = 'pending' | 'verified' | 'rejected'
export type PaymentMethod = 'transfer' | 'cash' | 'check'
export type AdjustmentType = 'beasiswa' | 'diskon' | 'penyesuaian'
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type NormalBalance = 'debit' | 'credit'
export type AccountSubType =
  | 'cash_bank'
  | 'receivable'
  | 'prepaid_expense'
  | 'inventory'
  | 'fixed_asset'
  | 'accumulated_depreciation'
  | 'intangible_asset'
  | 'investment'
  | 'other_asset'
  | 'payable'
  | 'customer_advance'
  | 'unearned_revenue'
  | 'tax_payable'
  | 'accrued_liability'
  | 'long_term_liability'
  | 'other_liability'
  | 'capital'
  | 'retained_earnings'
  | 'current_year_earnings'
  | 'withdrawal'
  | 'operating_revenue'
  | 'non_operating_revenue'
  | 'cost_of_goods_sold'
  | 'operating_expense'
  | 'depreciation_expense'
  | 'non_operating_expense'
  | 'tax_expense'

export const SUB_TYPE_LABELS: Record<AccountSubType, string> = {
  cash_bank: 'Kas & Bank',
  receivable: 'Piutang',
  prepaid_expense: 'Biaya Dibayar Dimuka',
  inventory: 'Persediaan',
  fixed_asset: 'Aset Tetap',
  accumulated_depreciation: 'Akumulasi Penyusutan (Kontra-Aset)',
  intangible_asset: 'Aset Tidak Berwujud',
  investment: 'Investasi',
  other_asset: 'Aset Lainnya',
  payable: 'Utang Usaha',
  customer_advance: 'Uang Muka Pelanggan/Santri',
  unearned_revenue: 'Pendapatan/Biaya Diterima Dimuka',
  tax_payable: 'Utang Pajak',
  accrued_liability: 'Beban Masih Harus Dibayar',
  long_term_liability: 'Liabilitas Jangka Panjang',
  other_liability: 'Liabilitas Lainnya',
  capital: 'Modal',
  retained_earnings: 'Laba Ditahan/Saldo Laba',
  current_year_earnings: 'Laba Tahun Berjalan',
  withdrawal: 'Prive/Distribusi',
  operating_revenue: 'Pendapatan Operasional',
  non_operating_revenue: 'Pendapatan Non-Operasional',
  cost_of_goods_sold: 'Beban Pokok/HPP',
  operating_expense: 'Beban Operasional',
  depreciation_expense: 'Beban Penyusutan',
  non_operating_expense: 'Beban Non-Operasional',
  tax_expense: 'Beban Pajak',
}

export const SUB_TYPES_BY_TYPE: Record<AccountType, AccountSubType[]> = {
  asset: [
    'cash_bank',
    'receivable',
    'prepaid_expense',
    'inventory',
    'fixed_asset',
    'accumulated_depreciation',
    'intangible_asset',
    'investment',
    'other_asset',
  ],
  liability: [
    'payable',
    'customer_advance',
    'unearned_revenue',
    'tax_payable',
    'accrued_liability',
    'long_term_liability',
    'other_liability',
  ],
  equity: ['capital', 'retained_earnings', 'current_year_earnings', 'withdrawal'],
  revenue: ['operating_revenue', 'non_operating_revenue'],
  expense: ['cost_of_goods_sold', 'operating_expense', 'depreciation_expense', 'non_operating_expense', 'tax_expense'],
}
export type JournalStatus = 'draft' | 'posted' | 'cancelled'
export type SourceType = 'invoice_issued' | 'payment_verified' | 'invoice_cancelled' | 'adjustment' | 'closing' | 'manual'
export type PeriodStatus = 'open' | 'closing' | 'closed' | 'locked'
export type BillingPeriodStatus = 'draft' | 'open' | 'closed'
export type BillingBatchStatus = 'processing' | 'completed' | 'failed'
export type BillingBatchTargetStatus =
  | 'pending'
  | 'created'
  | 'skipped_no_assignment'
  | 'skipped_wrong_scheme'
  | 'skipped_already_invoiced'
  | 'skipped_component_missing'
  | 'error'

// Entities
export interface AccountBrief {
  id: string
  code: string
  name: string
  type: AccountType
  sub_type: AccountSubType | null
}

export interface FeeComponent {
  id: string
  code: string
  name: string
  revenue_account_id: string
  receivable_account_id: string
  revenue_account?: AccountBrief
  receivable_account?: AccountBrief
  amount: number
  is_periodic: boolean
  period_type: PeriodType | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BillingSchemeItem {
  id: string
  fee_component_id: string
  fee_component?: FeeComponent
  amount_override: number | null
  is_required: boolean
  sort_order: number
}

export interface BillingScheme {
  id: string
  name: string
  description: string | null
  is_active: boolean
  items: BillingSchemeItem[]
  created_at: string
  updated_at: string
}

export interface SantriBillingAssignment {
  id: string
  santri_id: string
  billing_scheme_id: string
  billing_scheme?: {
    id: string
    name: string
  }
  effective_from: string
  effective_until: string | null
  assigned_by: string
  created_at: string
}

export interface BillingPeriod {
  id: string
  name: string
  period_type: PeriodType
  accounting_period_id: string
  start_date: string
  end_date: string
  status: BillingPeriodStatus
  created_at: string
  updated_at: string
}

export interface BillingPeriodBrief {
  id: string
  name: string
  status: BillingPeriodStatus
}

export interface BillingBatch {
  id: string
  name: string
  billing_scheme_id: string
  billing_period_id: string
  status: BillingBatchStatus
  created_by: string
  created_at: string
  completed_at: string | null
  total_created: number
  total_skipped: number
  total_error: number
}

export interface BillingBatchTarget {
  id: string
  santri_id: string
  status: BillingBatchTargetStatus
  invoice_id: string | null
  reason: string | null
  processed_at: string | null
}

export interface BillingBatchDetail extends BillingBatch {
  targets: BillingBatchTarget[]
}

export interface Invoice {
  id: string
  invoice_number: string
  santri_id: string
  user_id: string
  billing_scheme_id: string | null
  fee_component_id: string
  fee_component?: FeeComponent
  billing_period_id: string
  billing_period?: BillingPeriodBrief
  amount: number
  discount_amount: number
  paid_amount: number
  status: InvoiceStatus
  due_date: string
  issued_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  payments?: Payment[]
  adjustments?: InvoiceAdjustment[]
}

export interface Payment {
  id: string
  payment_number: string
  invoice_id: string
  invoice?: Invoice
  debit_account_id: string | null
  debit_account?: Account
  amount: number
  method: PaymentMethod
  reference_number: string | null
  payment_date: string
  status: PaymentStatus
  verified_by: string | null
  verified_at: string | null
  notes: string | null
  proof_key: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceAdjustment {
  id: string
  invoice_id: string
  type: AdjustmentType
  amount: number
  percentage: number | null
  description: string | null
  applied_by: string
  applied_at: string
}

export interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  sub_type: AccountSubType | null
  parent_id: string | null
  level: number
  is_postable: boolean
  normal_balance: NormalBalance
  description: string | null
  is_active: boolean
  is_system: boolean
  children?: Account[]
  created_at: string
  updated_at: string
}

export interface JournalEntryLine {
  id: string
  account_id: string
  account?: Account
  account_code: string
  account_name: string
  description: string | null
  debit: number
  credit: number
}

export interface JournalEntry {
  id: string
  journal_number: string
  entry_date: string
  description: string
  source_type: SourceType | null
  source_id: string | null
  period_id: string
  period?: AccountingPeriod
  total_debit: number
  total_credit: number
  posted_by: string
  posted_at: string | null
  status: JournalStatus
  lines: JournalEntryLine[]
  created_at: string
  updated_at: string
}

export interface AccountingPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  status: PeriodStatus
  closed_by: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

// Request DTOs
export interface CreateFeeComponentRequest {
  code: string
  name: string
  revenue_account_id: string
  receivable_account_id: string
  amount: number
  is_periodic: boolean
  period_type?: PeriodType
  description?: string
}

export interface UpdateFeeComponentRequest {
  revenue_account_id: string
  receivable_account_id: string
  name: string
  amount: number
  is_periodic: boolean
  period_type?: PeriodType | null
  description?: string | null
}

export interface CreateBillingSchemeRequest {
  name: string
  description?: string
}

export interface UpdateBillingSchemeRequest {
  name: string
  description?: string
}

export interface AddSchemeItemRequest {
  fee_component_id: string
  amount_override?: number
  is_required: boolean
  sort_order: number
}

export interface AssignSchemeRequest {
  santri_id: string
  billing_scheme_id: string
  effective_from: string
  effective_until?: string
}

export interface UpdateAssignmentRequest {
  billing_scheme_id: string
  effective_from: string
  effective_until?: string
}

export interface CreateInvoiceRequest {
  santri_id: string
  fee_component_id: string
  billing_period_id?: string
  issued_date: string
  amount: number
  due_date: string
  notes?: string
}

export interface CreateInvoiceBatchRequest {
  billing_scheme_id: string
  billing_period_id: string
  issued_date: string
  due_date: string
}

export interface CreateInvoiceBatchResponse {
  batch_id: string
  status: BillingBatchStatus
}

export interface CreateBillingPeriodRequest {
  name: string
  period_type: PeriodType
  accounting_period_id: string
  start_date: string
  end_date: string
}

export interface UpdateBillingPeriodRequest {
  name: string
  period_type: PeriodType
  start_date: string
  end_date: string
}

export interface ApplyAdjustmentRequest {
  type: AdjustmentType
  amount?: number
  percentage?: number
  description?: string
}

export interface CreatePaymentRequest {
  invoice_id: string
  debit_account_id?: string
  amount: number
  method: PaymentMethod
  reference_number?: string
  payment_date: string
  notes?: string
  proof_key?: string
}

export interface KeuanganSettingResponse {
  default_payment_debit_account_id?: string | null
  default_payment_debit_account?: AccountBrief | null
}

export interface UpdateKeuanganSettingRequest {
  default_payment_debit_account_id?: string | null
}

export interface PresignPaymentProofRequest {
  filename: string
  content_type: string
}

export interface PresignPaymentProofResponse {
  presign_url: string
  key: string
  expires_in: number
}

export interface SubmitPaymentRequest {
  invoice_id: string
  amount: number
  method: PaymentMethod
  reference_number?: string
  payment_date: string
  proof_key: string
  notes?: string
}

export interface VerifyPaymentRequest {
  debit_account_id: string
}

export interface PaymentProofResponse {
  url: string
  expires_in: number
}

export interface CreateAccountRequest {
  code: string
  name: string
  type: AccountType
  sub_type?: AccountSubType
  parent_id?: string
  normal_balance: NormalBalance
  description?: string
  is_postable: boolean
}

export interface UpdateAccountRequest {
  name: string
  sub_type?: AccountSubType
  description?: string
  is_postable: boolean
}

export interface CreateJournalEntryRequest {
  entry_date: string
  description: string
  period_id: string
  lines: Array<{
    account_id: string
    description?: string
    debit: number
    credit: number
  }>
}

export interface CreatePeriodRequest {
  name: string
  start_date: string
  end_date: string
}

// Query params
export interface FeeComponentListQuery {
  is_active?: boolean
  page?: number
  limit?: number
}

export interface BillingSchemeListQuery {
  is_active?: boolean
  page?: number
  limit?: number
}

export interface InvoiceListQuery {
  santri_id?: string
  user_id?: string
  status?: InvoiceStatus
  billing_period_id?: string
  period_id?: string
  page?: number
  limit?: number
}

export interface BillingPeriodListQuery {
  status?: BillingPeriodStatus
  accounting_period_id?: string
  page?: number
  limit?: number
}

export interface BillingBatchListQuery {
  status?: BillingBatchStatus
  page?: number
  limit?: number
}

export interface PaymentListQuery {
  invoice_id?: string
  status?: PaymentStatus
  period_id?: string
  page?: number
  limit?: number
}

export interface AccountListQuery {
  type?: AccountType
  sub_type?: AccountSubType
  is_active?: boolean
  page?: number
  limit?: number
}

export interface JournalListQuery {
  period_id?: string
  status?: JournalStatus
  source_type?: SourceType
  page?: number
  limit?: number
}

export interface PeriodListQuery {
  status?: PeriodStatus
  page?: number
  limit?: number
}

// Reports
export interface InvoiceSummary {
  billing_period_id: string
  billing_period_name: string
  total_tagihan: number
  total_terbayar: number
  total_tunggakan: number
  jumlah_invoice: number
  jumlah_lunas: number
  jumlah_belum: number
}

export interface OutstandingBySantri {
  santri_id: string
  total_outstanding: number
  invoice_count: number
}

export interface LedgerLine {
  date: string
  journal_number: string
  description: string
  debit: number
  credit: number
  balance: number
}

export interface LedgerResponse {
  account_id: string
  account_code: string
  account_name: string
  account_type: AccountType
  opening_balance: number
  lines: LedgerLine[]
  closing_balance: number
}

export interface TrialBalanceLine {
  account_id: string
  account_code: string
  account_name: string
  account_type: AccountType
  debit: number
  credit: number
}

export interface TrialBalanceResponse {
  period_id: string
  period_name: string
  lines: TrialBalanceLine[]
  total_debit: number
  total_credit: number
}

export interface BalanceSheetLine {
  account_id: string
  account_code: string
  account_name: string
  amount: number
}

export interface BalanceSheetResponse {
  as_of_date: string
  assets: BalanceSheetLine[]
  total_assets: number
  liabilities: BalanceSheetLine[]
  total_liabilities: number
  equities: BalanceSheetLine[]
  total_equities: number
}

export interface IncomeStatementLine {
  account_id: string
  account_code: string
  account_name: string
  amount: number
}

export interface IncomeStatementResponse {
  period_id: string
  period_name: string
  revenues: IncomeStatementLine[]
  total_revenue: number
  expenses: IncomeStatementLine[]
  total_expense: number
  net_income: number
}

// Pagination
export interface Meta {
  page: number
  limit: number
  total: number
  total_pages: number
}

// Santri self-service summary
export interface MyInvoiceSummary {
  total_tagihan: number
  total_terbayar: number
  total_tunggakan: number
  jumlah_invoice: number
  jumlah_lunas: number
  jumlah_belum: number
}

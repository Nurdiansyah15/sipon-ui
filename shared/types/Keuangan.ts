// Enums
export type FeeComponentType = 'ukt' | 'spp' | 'daftar_ulang' | 'insidental'
export type PeriodType = 'monthly' | 'semesterly' | 'yearly' | 'once'
export type InvoiceStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'expired' | 'cancelled'
export type PaymentStatus = 'pending' | 'verified' | 'rejected'
export type PaymentMethod = 'transfer' | 'cash' | 'check'
export type AdjustmentType = 'beasiswa' | 'diskon' | 'penyesuaian'
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type NormalBalance = 'debit' | 'credit'
export type JournalStatus = 'draft' | 'posted' | 'cancelled'
export type SourceType = 'invoice_issued' | 'payment_verified' | 'invoice_cancelled' | 'adjustment' | 'closing' | 'manual'
export type PeriodStatus = 'open' | 'closing' | 'closed' | 'locked'

// Entities
export interface FeeComponent {
  id: string
  code: string
  name: string
  type: FeeComponentType
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
  effective_from: string
  effective_until: string | null
  assigned_by: string
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  santri_id: string
  user_id: string
  billing_scheme_id: string | null
  fee_component_id: string
  fee_component?: FeeComponent
  periode: string
  tahun_ajaran: string
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
  type: FeeComponentType
  amount: number
  is_periodic: boolean
  period_type?: PeriodType
  description?: string
}

export interface UpdateFeeComponentRequest {
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

export interface CreateInvoiceRequest {
  santri_id: string
  fee_component_id: string
  periode: string
  tahun_ajaran: string
  amount: number
  due_date: string
  notes?: string
}

export interface CreateInvoiceBatchRequest {
  billing_scheme_id: string
  periode: string
  tahun_ajaran: string
  due_date: string
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

export interface CreateAccountRequest {
  code: string
  name: string
  type: AccountType
  parent_id?: string
  normal_balance: NormalBalance
  description?: string
  is_postable: boolean
}

export interface UpdateAccountRequest {
  name: string
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
  type?: FeeComponentType
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
  periode?: string
  tahun_ajaran?: string
  page?: number
  limit?: number
}

export interface PaymentListQuery {
  invoice_id?: string
  status?: PaymentStatus
  page?: number
  limit?: number
}

export interface AccountListQuery {
  type?: AccountType
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
  tahun_ajaran: string
  periode: string
  total_amount: number
  total_paid: number
  total_outstanding: number
  invoice_count: number
  paid_count: number
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
  lines: LedgerLine[]
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

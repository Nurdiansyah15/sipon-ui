<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { usePermission } from '~/composables/usePermission'
import type { Account, AccountType } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganAccountingStore()
const toast = useToast()
const { can } = usePermission()

const typeFilter = ref<string>('all')
const createModalOpen = ref(false)
const editModalOpen = ref(false)
const deleteModalOpen = ref(false)
const selectedAccount = ref<Account | null>(null)

const typeOptions = [
  { label: 'Semua Tipe', value: 'all' },
  { label: 'Aset', value: 'asset' },
  { label: 'Kewajiban', value: 'liability' },
  { label: 'Ekuitas', value: 'equity' },
  { label: 'Pendapatan', value: 'revenue' },
  { label: 'Beban', value: 'expense' },
]

const typeLabels: Record<AccountType, string> = {
  asset: 'Aset',
  liability: 'Kewajiban',
  equity: 'Ekuitas',
  revenue: 'Pendapatan',
  expense: 'Beban',
}

async function load() {
  try {
    await store.fetchAccounts({
      type: typeFilter.value === 'all' ? undefined : (typeFilter.value as AccountType),
      limit: 1000,
    })
  } catch {
    // error in store
  }
}

onMounted(load)

watch(typeFilter, () => load())

const accountsByType = computed(() => {
  const types: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense']
  const grouped: Record<AccountType, Account[]> = {
    asset: [],
    liability: [],
    equity: [],
    revenue: [],
    expense: [],
  }

  for (const acc of store.accounts) {
    if (grouped[acc.type]) {
      grouped[acc.type].push(acc)
    }
  }

  return types.map(t => ({
    type: t,
    label: typeLabels[t],
    accounts: grouped[t],
  }))
})

const expandedTypes = ref<Set<string>>(new Set(['asset', 'liability', 'equity', 'revenue', 'expense']))
const expandedAccounts = ref<Set<string>>(new Set())

function toggleType(type: string) {
  const s = new Set(expandedTypes.value)
  if (s.has(type)) s.delete(type)
  else s.add(type)
  expandedTypes.value = s
}

function toggleAccount(id: string) {
  const s = new Set(expandedAccounts.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expandedAccounts.value = s
}

function buildTree(accounts: Account[]): Account[] {
  const roots = accounts.filter(a => !a.parent_id)
  const childMap = new Map<string, Account[]>()
  for (const a of accounts) {
    if (a.parent_id) {
      if (!childMap.has(a.parent_id)) childMap.set(a.parent_id, [])
      childMap.get(a.parent_id)!.push(a)
    }
  }
  function attachChildren(node: Account): Account {
    const children = childMap.get(node.id) || []
    return { ...node, children: children.map(attachChildren) }
  }
  return roots.map(attachChildren)
}

function getTreeForType(accounts: Account[]): Account[] {
  return buildTree(accounts)
}

function rowActions(row: Account): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []

  if (can('manage_accounts')) {
    items.push({
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => openEdit(row),
    })
  }

  if (can('manage_accounts') && !row.is_system) {
    items.push({ type: 'separator' })
    items.push({
      label: row.is_active ? 'Nonaktifkan' : 'Aktifkan',
      icon: row.is_active ? 'i-lucide-eye-off' : 'i-lucide-eye',
      color: 'error',
      onSelect: () => confirmDelete(row),
    })
  }

  return items
}

const columns: TableColumn<Account>[] = [
  { accessorKey: 'code', header: 'Kode' },
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'type', header: 'Tipe' },
  { accessorKey: 'level', header: 'Level' },
  { accessorKey: 'is_postable', header: 'Postable' },
  { accessorKey: 'normal_balance', header: 'Saldo Normal' },
  { accessorKey: 'is_active', header: 'Aktif' },
  { accessorKey: 'is_system', header: 'Sistem' },
  { id: 'actions', header: '' },
]

function openCreate() {
  selectedAccount.value = null
  createModalOpen.value = true
}

function openEdit(account: Account) {
  selectedAccount.value = account
  editModalOpen.value = true
}

function confirmDelete(account: Account) {
  selectedAccount.value = account
  deleteModalOpen.value = true
}

async function handleDelete() {
  if (!selectedAccount.value) return
  try {
    await store.deleteAccount(selectedAccount.value.id)
    toast.add({ title: selectedAccount.value.is_active ? 'Akun dinonaktifkan' : 'Akun diaktifkan', color: 'success' })
    deleteModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal', description: store.error || undefined, color: 'error' })
  }
}

function onAccountSuccess() {
  createModalOpen.value = false
  editModalOpen.value = false
  load()
}

function formatNormalBalance(v: string) {
  return v === 'debit' ? 'Debit' : 'Kredit'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Chart of Accounts</h1>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Kelola daftar akun (COA) untuk sistem akuntansi keuangan.
          </p>
        </div>
        <UButton
          v-if="can('manage_accounts')"
          icon="i-lucide-plus"
          @click="openCreate"
        >
          Buat Akun
        </UButton>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-2">
        <USelect
          v-model="typeFilter"
          :items="typeOptions"
          value-key="value"
          placeholder="Semua Tipe"
          class="w-full sm:w-48"
        />
      </div>

      <div v-if="store.isLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="group in accountsByType"
          :key="group.type"
          class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900"
        >
          <button
            class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            @click="toggleType(group.type)"
          >
            <div class="flex items-center gap-2">
              <UIcon
                :name="expandedTypes.has(group.type) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                class="h-4 w-4 text-gray-400"
              />
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ group.label }}</h3>
              <UBadge color="neutral" variant="subtle" size="xs">{{ group.accounts.length }}</UBadge>
            </div>
          </button>

          <div v-if="expandedTypes.has(group.type)" class="border-t border-gray-200 dark:border-gray-700">
            <div
              v-for="account in getTreeForType(group.accounts)"
              :key="account.id"
              class="divide-y divide-gray-100 dark:divide-gray-800"
            >
              <KeuanganAccountTreeRow
                :account="account"
                :depth="0"
                :expanded-accounts="expandedAccounts"
                @toggle="toggleAccount"
                @edit="openEdit"
                @delete="confirmDelete"
                :can-manage="can('manage_accounts')"
              />
            </div>
            <div v-if="group.accounts.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
              Tidak ada akun untuk tipe ini
            </div>
          </div>
        </div>
      </div>

      <AdminKeuanganAdminAccountFormModal
        v-model:open="createModalOpen"
        mode="create"
        @success="onAccountSuccess"
      />

      <AdminKeuanganAdminAccountFormModal
        v-model:open="editModalOpen"
        mode="edit"
        :account="selectedAccount"
        @success="onAccountSuccess"
      />

      <ConfirmActionModal
        v-model:open="deleteModalOpen"
        title="Nonaktifkan Akun"
        :message="`Apakah Anda yakin ingin menonaktifkan akun ${selectedAccount?.code} - ${selectedAccount?.name}?`"
        confirm-label="Nonaktifkan"
        confirm-color="error"
        :loading="store.isSubmitting"
        @confirm="handleDelete"
      />
    </div>
</template>

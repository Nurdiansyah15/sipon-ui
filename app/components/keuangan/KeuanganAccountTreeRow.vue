<script setup lang="ts">
import type { Account, AccountType, NormalBalance } from '#shared/types/Keuangan'
import { SUB_TYPE_LABELS } from '#shared/types/Keuangan'

const props = defineProps<{
  account: Account
  depth: number
  expandedAccounts: Set<string>
  canManage: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  edit: [account: Account]
  delete: [account: Account]
}>()

const hasChildren = computed(() => props.account.children && props.account.children.length > 0)
const isExpanded = computed(() => props.expandedAccounts.has(props.account.id))

const typeLabels: Record<AccountType, string> = {
  asset: 'Aset',
  liability: 'Kewajiban',
  equity: 'Ekuitas',
  revenue: 'Pendapatan',
  expense: 'Beban',
}

import type { DropdownMenuItem } from '@nuxt/ui'

function rowActions(account: Account): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (props.canManage) {
    items.push({
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => emit('edit', account),
    })
  }
  if (props.canManage && !account.is_system) {
    items.push({ type: 'separator' })
    items.push({
      label: account.is_active ? 'Nonaktifkan' : 'Aktifkan',
      icon: account.is_active ? 'i-lucide-eye-off' : 'i-lucide-eye',
      color: 'error',
      onSelect: () => emit('delete', account),
    })
  }
  return items
}
</script>

<template>
  <div>
    <div
      class="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      :style="{ paddingLeft: `${1 + depth * 1.5}rem` }"
    >
      <button
        v-if="hasChildren"
        class="shrink-0 rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
        @click="emit('toggle', account.id)"
      >
        <UIcon
          :name="isExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
          class="h-3.5 w-3.5 text-gray-400"
        />
      </button>
      <div v-else class="w-5" />

      <code class="shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400">{{ account.code }}</code>
      <span class="min-w-0 flex-1 truncate text-gray-900 dark:text-gray-100">{{ account.name }}</span>

      <div class="flex shrink-0 items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span class="hidden sm:inline">{{ typeLabels[account.type] }}</span>
        <span v-if="account.sub_type" class="hidden md:inline text-gray-400">
          {{ SUB_TYPE_LABELS[account.sub_type] }}
        </span>
        <span>L{{ account.level }}</span>
        <UBadge v-if="account.is_postable" color="primary" variant="subtle" size="xs">Postable</UBadge>
        <span class="hidden sm:inline">{{ account.normal_balance === 'debit' ? 'D' : 'K' }}</span>
        <UBadge :color="account.is_active ? 'success' : 'neutral'" variant="subtle" size="xs">
          {{ account.is_active ? 'Aktif' : 'Nonaktif' }}
        </UBadge>
        <UBadge v-if="account.is_system" color="warning" variant="subtle" size="xs">Sistem</UBadge>
      </div>

      <div class="shrink-0">
        <AppRowActions :items="rowActions(account)" />
      </div>
    </div>

    <div v-if="isExpanded && hasChildren">
      <KeuanganAccountTreeRow
        v-for="child in account.children"
        :key="child.id"
        :account="child"
        :depth="depth + 1"
        :expanded-accounts="expandedAccounts"
        :can-manage="canManage"
        @toggle="(id) => emit('toggle', id)"
        @edit="(a) => emit('edit', a)"
        @delete="(a) => emit('delete', a)"
      />
    </div>
  </div>
</template>

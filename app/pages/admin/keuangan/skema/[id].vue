<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'
import type { BillingScheme, BillingSchemeItem, FeeComponent } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const route = useRoute()
const router = useRouter()
const store = useKeuanganStore()
const toast = useToast()
const { can } = usePermission()

const schemeId = route.params.id as string
const scheme = ref<BillingScheme | null>(null)
const loading = ref(true)
const allComponents = ref<FeeComponent[]>([])

async function load() {
  loading.value = true
  try {
    const [schemeData] = await Promise.all([
      store.fetchBillingScheme(schemeId),
      store.fetchFeeComponents({ limit: 100 }),
    ])
    scheme.value = schemeData
    allComponents.value = store.feeComponents
  } catch {
    toast.add({ title: 'Gagal memuat data skema', color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(load)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

const columns: TableColumn<BillingSchemeItem>[] = [
  { id: 'component_code', header: 'Kode' },
  { id: 'component_name', header: 'Nama Komponen' },
  { accessorKey: 'amount_override', header: 'Jumlah' },
  { accessorKey: 'is_required', header: 'Wajib' },
  { accessorKey: 'sort_order', header: 'Urutan' },
  { id: 'actions', header: 'Aksi' },
]

const addItemOpen = ref(false)

function openAddItem() {
  addItemOpen.value = true
}

const removeOpen = ref(false)
const removeTarget = ref<BillingSchemeItem | null>(null)
const removeDeleting = ref(false)

function openRemove(item: BillingSchemeItem) {
  removeTarget.value = item
  removeOpen.value = true
}

async function confirmRemove() {
  if (!removeTarget.value) return
  removeDeleting.value = true
  try {
    await store.removeSchemeItem(schemeId, removeTarget.value.id)
    removeOpen.value = false
    toast.add({ title: 'Item skema dihapus', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal menghapus item skema', color: 'error' })
  } finally {
    removeDeleting.value = false
  }
}

const editSchemeOpen = ref(false)

function openEditScheme() {
  editSchemeOpen.value = true
}

function rowActions(item: BillingSchemeItem): DropdownMenuItem[] {
  return [
    { label: 'Hapus', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openRemove(item) },
  ]
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <template v-else-if="scheme">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <UButton variant="ghost" size="sm" icon="i-lucide-arrow-left" @click="router.push('/admin/keuangan/skema')">
              Kembali
            </UButton>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ scheme.name }}</h1>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ scheme.description || 'Tidak ada deskripsi' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <UBadge :color="scheme.is_active ? 'success' : 'error'" variant="subtle" size="sm">
            {{ scheme.is_active ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
          <UButton
            v-if="can('manage_keuangan')"
            variant="outline"
            icon="i-lucide-pencil"
            @click="openEditScheme"
          >
            Edit Skema
          </UButton>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Item Skema</h2>
        <UButton
          v-if="can('manage_keuangan')"
          icon="i-lucide-plus"
          class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
          @click="openAddItem"
        >
          Tambah Item
        </UButton>
      </div>

      <div
        v-if="!scheme.items || scheme.items.length === 0"
        class="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900"
      >
        <UIcon name="i-lucide-layers" class="mx-auto h-12 w-12 text-gray-400" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Belum ada item dalam skema ini</p>
        <UButton
          v-if="can('manage_keuangan')"
          color="primary"
          variant="outline"
          class="mt-3"
          @click="openAddItem"
        >
          Tambah Item Pertama
        </UButton>
      </div>

      <div v-else class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <UTable
          :data="scheme.items"
          :columns="columns"
          class="w-full"
          :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
        >
          <template #component_code-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ row.original.fee_component?.code ?? '-' }}
            </span>
          </template>

          <template #component_name-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ row.original.fee_component?.name ?? '-' }}
            </span>
          </template>

          <template #amount_override-cell="{ row }">
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ row.original.amount_override != null ? formatCurrency(row.original.amount_override) : `${formatCurrency(row.original.fee_component?.amount ?? 0)} (default)` }}
            </span>
          </template>

          <template #is_required-cell="{ row }">
            <UBadge :color="row.original.is_required ? 'success' : 'neutral'" variant="subtle" size="sm">
              {{ row.original.is_required ? 'Wajib' : 'Opsional' }}
            </UBadge>
          </template>

          <template #sort_order-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.original.sort_order }}</span>
          </template>

          <template #actions-cell="{ row }">
            <AppRowActions v-if="can('manage_keuangan')" :items="rowActions(row.original)" />
          </template>
        </UTable>
      </div>
    </template>

    <template v-else>
      <div class="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
        <UIcon name="i-lucide-alert-circle" class="mx-auto h-12 w-12 text-gray-400" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Skema tagihan tidak ditemukan</p>
        <UButton variant="outline" class="mt-3" @click="router.push('/admin/keuangan/skema')">Kembali ke Daftar</UButton>
      </div>
    </template>

    <AdminKeuanganAdminSchemeItemFormModal
      v-if="scheme"
      v-model:open="addItemOpen"
      :scheme-id="schemeId"
      :components="allComponents"
      @success="load"
    />

    <AdminKeuanganAdminBillingSchemeFormModal
      v-if="scheme"
      v-model:open="editSchemeOpen"
      :scheme="scheme"
      @success="load"
    />

    <AdminConfirmActionModal
      :open="removeOpen"
      title="Hapus Item Skema"
      :description="`Yakin ingin menghapus item '${removeTarget?.fee_component?.name ?? ''}' dari skema ini?`"
      confirm-label="Hapus"
      color="error"
      :loading="removeDeleting"
      @update:open="removeOpen = $event"
      @confirm="confirmRemove"
    />
  </div>
</template>

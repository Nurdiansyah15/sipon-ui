<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'
import type { BillingScheme } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const toast = useToast()
const { can } = usePermission()
const router = useRouter()

const page = ref(1)
const limit = ref(10)

watch([page, limit], () => load())

async function load() {
  try {
    await store.fetchBillingSchemes({
      page: page.value,
      limit: limit.value,
    })
  } catch {
    // error set in store
  }
}

onMounted(load)

const billingSchemes = computed(() => store.billingSchemes.filter((s) => s != null))

const totalPages = computed(() => store.billingSchemesMeta?.total_pages ?? 1)
const totalItems = computed(() => store.billingSchemesMeta?.total ?? 0)

const columns: TableColumn<BillingScheme>[] = [
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'description', header: 'Deskripsi' },
  { accessorKey: 'items', header: 'Item' },
  { accessorKey: 'is_active', header: 'Aktif' },
  { id: 'actions', header: 'Aksi' },
]

const formOpen = ref(false)
const editTarget = ref<BillingScheme | null>(null)

function openCreate() {
  editTarget.value = null
  formOpen.value = true
}

function openEdit(row: BillingScheme) {
  editTarget.value = row
  formOpen.value = true
}

const deleteOpen = ref(false)
const deleteTarget = ref<BillingScheme | null>(null)
const deleteDeleting = ref(false)

function openDelete(row: BillingScheme) {
  deleteTarget.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteDeleting.value = true
  try {
    await store.deleteBillingScheme(deleteTarget.value.id)
    deleteOpen.value = false
    toast.add({ title: 'Skema tagihan dihapus', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal menghapus skema tagihan', color: 'error' })
  } finally {
    deleteDeleting.value = false
  }
}

function rowActions(row: BillingScheme): DropdownMenuItem[] {
  return [
    { label: 'Kelola Item', icon: 'i-lucide-list-ordered', onSelect: () => router.push(`/admin/keuangan/skema/${row.id}`) },
    { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(row) },
    { label: 'Hapus', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDelete(row) },
  ]
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Skema Tagihan</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Kelola skema tagihan dan kelengkapan item di dalamnya.</p>
      </div>
      <UButton
        v-if="can('manage_keuangan')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="openCreate"
      >
        Tambah Skema
      </UButton>
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="billingSchemes"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #name-cell="{ row }">
          <NuxtLink
            :to="`/admin/keuangan/skema/${row.original.id}`"
            class="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            {{ row.original.name }}
          </NuxtLink>
        </template>

        <template #description-cell="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ row.original.description || '-' }}</span>
        </template>

        <template #items-cell="{ row }">
          <UBadge variant="subtle" color="neutral" size="sm">
            {{ row.original.items?.length ?? 0 }} item
          </UBadge>
        </template>

        <template #is_active-cell="{ row }">
          <UBadge :color="row.original.is_active ? 'success' : 'error'" variant="subtle" size="sm">
            {{ row.original.is_active ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions v-if="can('manage_keuangan')" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} skema · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :sibling-count="1"
        show-edges
      >
        <template #item="{ item, page: curPage }">
          <UButton
            :color="curPage === item.value ? 'teal' : 'neutral'"
            :variant="curPage === item.value ? 'solid' : 'outline'"
            :label="String(item.value)"
            size="sm"
            :class="curPage === item.value ? 'bg-teal-600 text-white dark:bg-teal-500' : ''"
          />
        </template>
      </UPagination>
    </div>

    <AdminKeuanganAdminBillingSchemeFormModal
      v-model:open="formOpen"
      :scheme="editTarget"
      @success="load"
    />

    <AdminConfirmActionModal
      :open="deleteOpen"
      title="Hapus Skema Tagihan"
      :description="`Yakin ingin menghapus skema '${deleteTarget?.name ?? ''}'? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus"
      color="error"
      :loading="deleteDeleting"
      @update:open="deleteOpen = $event"
      @confirm="confirmDelete"
    />
  </div>
</template>

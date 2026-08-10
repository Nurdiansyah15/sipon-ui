<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { usePersuratanStore } from '~/stores/persuratan'
import { usePermission } from '~/composables/usePermission'
import type { TipeSuratItem } from '#shared/types/Persuratan'

definePageMeta({ layout: 'kesantrian' })

const store = usePersuratanStore()
const toast = useToast()
const { can } = usePermission()

const columns: TableColumn<TipeSuratItem>[] = [
  { accessorKey: 'nama', header: 'Nama' },
  { accessorKey: 'kode', header: 'Kode' },
  { accessorKey: 'created_at', header: 'Dibuat' },
  { id: 'actions', header: '' },
]

async function load() {
  try {
    await store.fetchTipeSuratList()
  } catch {
    // error in store
  }
}

onMounted(load)

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

const formOpen = ref(false)
const editTarget = ref<TipeSuratItem | null>(null)

function openCreate() {
  editTarget.value = null
  formOpen.value = true
}

function openEdit(row: TipeSuratItem) {
  editTarget.value = row
  formOpen.value = true
}

const deleteOpen = ref(false)
const deleteTarget = ref<TipeSuratItem | null>(null)

function openDelete(row: TipeSuratItem) {
  deleteTarget.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await store.deleteTipeSurat(deleteTarget.value.id)
    deleteOpen.value = false
    toast.add({ title: 'Tipe surat berhasil dihapus', color: 'success' })
    await load()
  } catch {
    toast.add({ title: 'Gagal menghapus tipe surat', description: store.error ?? undefined, color: 'error' })
  }
}

function rowActions(row: TipeSuratItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (can('manage_persuratan')) {
    items.push({ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(row) })
    items.push({ type: 'separator' })
    items.push({ label: 'Hapus', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDelete(row) })
  }
  return items
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Tipe Surat</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Master jenis surat yang dipakai untuk penomoran surat keluar.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
          @click="navigateTo('/admin/kesantrian/persuratan')"
        >
          Kembali ke Persuratan
        </UButton>
        <UButton
          v-if="can('manage_persuratan')"
          icon="i-lucide-plus"
          color="primary"
          @click="openCreate"
        >
          Buat Tipe Surat
        </UButton>
      </div>
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable :data="store.tipeSuratList" :columns="columns" :loading="store.isLoading" class="w-full">
        <template #nama-cell="{ row }">
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.nama }}</span>
        </template>

        <template #kode-cell="{ row }">
          <code class="rounded bg-gray-100 px-2 py-0.5 text-sm font-semibold text-teal-700 dark:bg-gray-800 dark:text-teal-400">
            {{ row.original.kode }}
          </code>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions v-if="rowActions(row.original).length > 0" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div v-if="store.tipeSuratList.length === 0 && !store.isLoading" class="mt-4 rounded-lg border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
      <p class="text-sm text-gray-500 dark:text-gray-400">Belum ada tipe surat. Buat tipe surat pertama Anda.</p>
    </div>

    <AdminPersuratanTipeSuratFormModal
      v-model:open="formOpen"
      :tipe-surat="editTarget"
      @success="load"
    />

    <AdminConfirmActionModal
      v-model:open="deleteOpen"
      title="Hapus Tipe Surat"
      :description="`Yakin ingin menghapus tipe surat '${deleteTarget?.nama}'?`"
      confirm-label="Hapus"
      color="error"
      :loading="store.isSubmitting"
      @confirm="confirmDelete"
    />
  </div>
</template>

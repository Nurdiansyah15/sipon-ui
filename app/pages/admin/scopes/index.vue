<script setup lang="ts">
import { z } from 'zod'
import type { TableColumn, DropdownMenuItem, FormSubmitEvent } from '@nuxt/ui'
import { useScopeStore } from '~/stores/scope'
import { usePermission } from '~/composables/usePermission'
import type { ScopeItem } from '#shared/types/Scope'
import { SCOPE_TYPE_LABELS, SCOPE_TYPE_COLORS } from '#shared/types/Scope'

definePageMeta({ layout: 'admin' })

const store = useScopeStore()
const toast = useToast()
const { can } = usePermission()

const canManage = computed(() => can('manage_system_settings'))

const scopeTypeFilter = ref<string>('all')
const statusFilter = ref<string>('all')

const scopeTypeOptions = [
  { label: 'Semua Tipe', value: 'all' },
  { label: 'Gender', value: 'gender' },
]

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
]

const filteredItems = computed(() => {
  if (statusFilter.value === 'all') return store.items
  if (statusFilter.value === 'active') return store.items.filter((s) => s.is_active)
  return store.items.filter((s) => !s.is_active)
})

async function load() {
  try {
    await store.fetchList({
      scope_type: scopeTypeFilter.value === 'all' ? undefined : scopeTypeFilter.value,
      include_inactive: true,
    })
  } catch {
    // error set in store
  }
}

watch([scopeTypeFilter], () => load())
onMounted(load)

function scopeTypeLabel(type: string) {
  return SCOPE_TYPE_LABELS[type] || type
}

function scopeTypeClass(type: string) {
  return SCOPE_TYPE_COLORS[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

const columns: TableColumn<ScopeItem>[] = [
  { accessorKey: 'scope_type', header: 'Tipe' },
  { accessorKey: 'code', header: 'Kode' },
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'description', header: 'Deskripsi' },
  { accessorKey: 'is_active', header: 'Status' },
  { accessorKey: 'created_at', header: 'Dibuat' },
  { id: 'actions', header: 'Aksi' },
]

// ── Create Modal ───────────────────────────────────────────────────────────────
const createOpen = ref(false)
const createSaving = ref(false)

const createSchema = z.object({
  scope_type: z.string().min(1, 'Tipe scope wajib diisi'),
  code: z.string().min(1, 'Kode scope wajib diisi'),
  name: z.string().min(1, 'Nama scope wajib diisi'),
  description: z.string().nullable().optional(),
})
type CreateSchema = z.output<typeof createSchema>

const createState = reactive<Partial<CreateSchema>>({
  scope_type: 'gender',
  code: '',
  name: '',
  description: null,
})

function openCreate() {
  createState.scope_type = 'gender'
  createState.code = ''
  createState.name = ''
  createState.description = null
  createOpen.value = true
}

async function doCreate(event: FormSubmitEvent<CreateSchema>) {
  createSaving.value = true
  try {
    await store.create({
      scope_type: event.data.scope_type.toLowerCase().trim(),
      code: event.data.code.toLowerCase().trim(),
      name: event.data.name,
      description: event.data.description || undefined,
    })
    createOpen.value = false
    toast.add({ title: 'Scope berhasil dibuat', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error || 'Gagal membuat scope', color: 'error' })
  } finally {
    createSaving.value = false
  }
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
const editOpen = ref(false)
const editTarget = ref<ScopeItem | null>(null)
const editSaving = ref(false)

const editState = reactive<{ name: string; description: string; is_active: boolean }>({
  name: '',
  description: '',
  is_active: true,
})

function openEdit(row: ScopeItem) {
  editTarget.value = row
  editState.name = row.name
  editState.description = row.description ?? ''
  editState.is_active = row.is_active
  editOpen.value = true
}

async function saveEdit() {
  if (!editTarget.value) return
  editSaving.value = true
  try {
    await store.update(editTarget.value.id, {
      name: editState.name || undefined,
      description: editState.description || undefined,
      is_active: editState.is_active,
    })
    editOpen.value = false
    toast.add({ title: 'Scope berhasil diperbarui', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal memperbarui scope', color: 'error' })
  } finally {
    editSaving.value = false
  }
}

// ── Delete Modal ───────────────────────────────────────────────────────────────
const deleteOpen = ref(false)
const deleteTarget = ref<ScopeItem | null>(null)
const deleteDeleting = ref(false)

function openDelete(row: ScopeItem) {
  deleteTarget.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteDeleting.value = true
  try {
    await store.remove(deleteTarget.value.id)
    deleteOpen.value = false
    toast.add({ title: 'Scope berhasil dihapus', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal menghapus scope', color: 'error' })
  } finally {
    deleteDeleting.value = false
  }
}

// ── Row Actions ────────────────────────────────────────────────────────────────
function rowActions(row: ScopeItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (canManage.value) {
    items.push({ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(row) })
  }
  if (canManage.value) {
    items.push({ label: 'Hapus', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDelete(row) })
  }
  return items
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kelola Scope</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Kelola master klasifikasi scope (mis. gender) yang dipakai untuk memfilter data antar-module.
        </p>
      </div>
      <UButton v-if="canManage" icon="i-lucide-plus" color="primary" @click="openCreate">
        Tambah Scope
      </UButton>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap gap-3">
      <USelect
        v-model="scopeTypeFilter"
        :items="scopeTypeOptions"
        value-key="value"
        class="w-full sm:w-44"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        value-key="value"
        class="w-full sm:w-44"
      />
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="filteredItems.length === 0"
      class="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900"
    >
      <UIcon name="i-lucide-tags" class="mx-auto h-12 w-12 text-gray-400" />
      <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Belum ada data scope</p>
      <UButton
        v-if="canManage"
        color="primary"
        variant="outline"
        class="mt-3"
        @click="openCreate"
      >
        Tambah Scope Pertama
      </UButton>
    </div>

    <!-- Table -->
    <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable :columns="columns" :data="filteredItems">
        <template #scope_type-cell="{ row }">
          <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="scopeTypeClass(row.original.scope_type)">
            {{ scopeTypeLabel(row.original.scope_type) }}
          </span>
        </template>
        <template #code-cell="{ row }">
          <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {{ row.original.code }}
          </code>
        </template>
        <template #name-cell="{ row }">
          <p class="font-medium text-gray-900 dark:text-gray-100">{{ row.original.name }}</p>
        </template>
        <template #description-cell="{ row }">
          <p class="max-w-[240px] truncate text-sm text-gray-600 dark:text-gray-400">
            {{ row.original.description || '-' }}
          </p>
        </template>
        <template #is_active-cell="{ row }">
          <UBadge :color="row.original.is_active ? 'success' : 'neutral'" variant="soft" size="sm">
            {{ row.original.is_active ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>
        <template #created_at-cell="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.original.created_at) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <AppRowActions v-if="canManage" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>
  </div>

  <!-- Create Modal -->
  <UModal v-model:open="createOpen">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tambah Scope</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="createOpen = false" />
        </div>

        <UForm :schema="createSchema" :state="createState" class="space-y-4" @submit="doCreate">
          <UFormField label="Tipe Scope" name="scope_type" required>
            <UInputMenu
              v-model="createState.scope_type"
              :items="[{ label: 'Gender', value: 'gender' }]"
              value-key="value"
              class="w-full"
              placeholder="gender"
            />
            <template #help>
              <span class="text-xs">Tipe extensible — ketik manual untuk tipe baru.</span>
            </template>
          </UFormField>

          <UFormField label="Kode" name="code" required>
            <UInput v-model="createState.code" class="w-full" placeholder="Contoh: male, female" />
          </UFormField>

          <UFormField label="Nama" name="name" required>
            <UInput v-model="createState.name" class="w-full" placeholder="Contoh: Laki-laki" />
          </UFormField>

          <UFormField label="Deskripsi" name="description">
            <UTextarea v-model="createState.description" class="w-full" placeholder="Deskripsi singkat (opsional)" :rows="2" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" @click="createOpen = false">Batal</UButton>
            <UButton type="submit" :loading="createSaving">Simpan</UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>

  <!-- Edit Modal -->
  <UModal v-model:open="editOpen">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Scope</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="editOpen = false" />
        </div>

        <div v-if="editTarget" class="space-y-4">
          <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="scopeTypeClass(editTarget.scope_type)">
              {{ scopeTypeLabel(editTarget.scope_type) }}
            </span>
            <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              {{ editTarget.code }}
            </code>
          </div>

          <UFormField label="Nama" required>
            <UInput v-model="editState.name" placeholder="Nama scope" />
          </UFormField>

          <UFormField label="Deskripsi">
            <UTextarea v-model="editState.description" placeholder="Deskripsi (opsional)" :rows="2" />
          </UFormField>

          <UFormField label="Status Aktif">
            <USwitch v-model="editState.is_active" class="mb-1" />
            <template #help>
              <span class="text-xs">{{ editState.is_active ? 'Scope aktif dan dipakai untuk filtering' : 'Scope nonaktif (tidak dimasukkan ke resolusi akses)' }}</span>
            </template>
          </UFormField>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="editSaving" @click="editOpen = false">Batal</UButton>
          <UButton color="primary" :loading="editSaving" @click="saveEdit">Simpan</UButton>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Delete Confirm Modal -->
  <AdminConfirmActionModal
    :open="deleteOpen"
    title="Hapus Scope"
    :description="`Yakin ingin menghapus scope '${deleteTarget?.name ?? ''}' (${deleteTarget?.code ?? ''})? Tindakan ini tidak dapat dibatalkan.`"
    confirm-label="Hapus"
    color="error"
    :loading="deleteDeleting"
    @update:open="deleteOpen = $event"
    @confirm="confirmDelete"
  />
</template>

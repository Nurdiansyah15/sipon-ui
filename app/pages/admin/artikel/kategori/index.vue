<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useArticleStore } from '~/stores/article'
import { usePermission } from '~/composables/usePermission'
import type { CategoryItem, CreateCategoryRequest, UpdateCategoryRequest } from '#shared/types/Article'

definePageMeta({ layout: 'article' })

const store = useArticleStore()
const toast = useToast()
const { can } = usePermission()

const categories = ref<CategoryItem[]>([])
const isLoading = ref(false)

async function load() {
  isLoading.value = true
  try {
    categories.value = await store.fetchCategories()
  } catch {
    toast.add({ title: 'Gagal memuat kategori', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const columns: TableColumn<CategoryItem>[] = [
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'is_active', header: 'Status' },
  { accessorKey: 'sort_order', header: 'Urutan' },
  { id: 'actions', header: '' },
]

function rowActions(row: CategoryItem): DropdownMenuItem[] {
  if (!can('manage_article_category')) return []

  return [
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => openEdit(row),
    },
    {
      type: 'separator',
    },
    {
      label: 'Hapus',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => confirmDelete(row),
    },
  ]
}

const createModalOpen = ref(false)
const editModalOpen = ref(false)
const deleteModalOpen = ref(false)

const selectedCategory = ref<CategoryItem | null>(null)

function openCreate() {
  selectedCategory.value = null
  createModalOpen.value = true
}

function openEdit(row: CategoryItem) {
  selectedCategory.value = row
  editModalOpen.value = true
}

function confirmDelete(row: CategoryItem) {
  selectedCategory.value = row
  deleteModalOpen.value = true
}

async function handleDelete() {
  if (!selectedCategory.value) return
  try {
    await store.deleteCategory(selectedCategory.value.id)
    toast.add({ title: 'Kategori berhasil dihapus', color: 'success' })
    deleteModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal menghapus kategori', description: store.error || undefined, color: 'error' })
  }
}

function onCategoryCreated() {
  createModalOpen.value = false
  load()
}

function onCategoryUpdated() {
  editModalOpen.value = false
  load()
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kategori Artikel</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Kelola kategori untuk mengorganisir artikel berdasarkan topik.
        </p>
      </div>
      <UButton
        v-if="can('manage_article_category')"
        icon="i-lucide-plus"
        @click="openCreate"
      >
        Tambah Kategori
      </UButton>
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="categories"
        :columns="columns"
        :loading="isLoading"
        class="w-full"
      >
        <template #is_active-cell="{ row }">
          <UBadge
            :color="row.original.is_active ? 'success' : 'default'"
            variant="subtle"
          >
            {{ row.original.is_active ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <AppRowActions v-if="can('manage_article_category')" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <CategoryFormModal
      v-model:open="createModalOpen"
      mode="create"
      @created="onCategoryCreated"
    />

    <CategoryFormModal
      v-model:open="editModalOpen"
      mode="edit"
      :category="selectedCategory"
      @updated="onCategoryUpdated"
    />

    <ConfirmActionModal
      v-model:open="deleteModalOpen"
      title="Hapus Kategori"
      message="Apakah Anda yakin ingin menghapus kategori ini? Artikel yang memiliki kategori ini tidak akan terpengaruh."
      confirm-label="Hapus"
      confirm-color="error"
      :loading="store.isSubmitting"
      @confirm="handleDelete"
    />
  </div>
</template>

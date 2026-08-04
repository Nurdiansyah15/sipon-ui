<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useArticleStore } from '~/stores/article'
import { usePermission } from '~/composables/usePermission'
import type { ArticleListItem, ArticleDetail, CategoryItem, CreateArticleRequest, UpdateArticleRequest } from '#shared/types/Article'
import { STATUS_COLORS, STATUS_LABELS } from '#shared/types/Article'

definePageMeta({ layout: 'article' })

const store = useArticleStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const search = ref('')
const statusFilter = ref<string>('all')
const categoryFilter = ref<string>('all')
const categories = ref<CategoryItem[]>([])

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
watch([page, limit, statusFilter, categoryFilter], () => load())

async function load() {
  try {
    await store.fetchList({
      page: page.value,
      limit: limit.value,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      category_id: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
      q: search.value || undefined,
      sort_by: 'created_at',
      sort_type: 'DESC',
    })
  } catch {
    // error set in store
  }
}

async function loadCategories() {
  try {
    categories.value = await store.fetchCategories()
  } catch {
    // ignore
  }
}

onMounted(async () => {
  await Promise.all([load(), loadCategories()])
})

const totalPages = computed(() => store.meta?.total_pages ?? 1)
const totalItems = computed(() => store.meta?.total ?? 0)

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

const columns: TableColumn<ArticleListItem>[] = [
  { accessorKey: 'title', header: 'Judul' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'category_name', header: 'Kategori' },
  { accessorKey: 'author', header: 'Penulis' },
  { accessorKey: 'published_at', header: 'Dipublikasi' },
  { id: 'actions', header: '' },
]

function rowActions(row: ArticleListItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [
    {
      label: 'Lihat',
      icon: 'i-lucide-eye',
      onSelect: () => openDetail(row),
    },
  ]

  if (can('edit_article')) {
    items.push({
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => openEdit(row),
    })
  }

  if (can('publish_article') && row.status === 'draft') {
    items.push({
      label: 'Publikasikan',
      icon: 'i-lucide-send',
      onSelect: () => confirmPublish(row),
    })
  }

  if (can('publish_article') && row.status === 'published') {
    items.push({
      label: 'Arsipkan',
      icon: 'i-lucide-archive',
      onSelect: () => confirmArchive(row),
    })
  }

  if (can('edit_article') && row.status === 'draft') {
    items.push({
      type: 'separator',
    })
    items.push({
      label: 'Hapus',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => confirmDelete(row),
    })
  }

  return items
}

const createModalOpen = ref(false)
const editModalOpen = ref(false)
const detailModalOpen = ref(false)
const deleteModalOpen = ref(false)
const publishModalOpen = ref(false)
const archiveModalOpen = ref(false)

const selectedArticle = ref<ArticleListItem | null>(null)
const selectedArticleDetail = ref<ArticleDetail | null>(null)
const isDetailLoading = ref(false)

function openCreate() {
  selectedArticle.value = null
  createModalOpen.value = true
}

function openEdit(row: ArticleListItem) {
  selectedArticle.value = row
  editModalOpen.value = true
}

async function openDetail(row: ArticleListItem) {
  selectedArticle.value = row
  selectedArticleDetail.value = null
  detailModalOpen.value = true
  isDetailLoading.value = true
  try {
    selectedArticleDetail.value = await store.fetchDetail(row.id)
  } catch {
    toast.add({ title: 'Gagal memuat detail artikel', color: 'error' })
  } finally {
    isDetailLoading.value = false
  }
}

function confirmDelete(row: ArticleListItem) {
  selectedArticle.value = row
  deleteModalOpen.value = true
}

function confirmPublish(row: ArticleListItem) {
  selectedArticle.value = row
  publishModalOpen.value = true
}

function confirmArchive(row: ArticleListItem) {
  selectedArticle.value = row
  archiveModalOpen.value = true
}

async function handleDelete() {
  if (!selectedArticle.value) return
  try {
    await store.remove(selectedArticle.value.id)
    toast.add({ title: 'Artikel berhasil dihapus', color: 'success' })
    deleteModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal menghapus artikel', description: store.error || undefined, color: 'error' })
  }
}

async function handlePublish() {
  if (!selectedArticle.value) return
  try {
    await store.publish(selectedArticle.value.id)
    toast.add({ title: 'Artikel berhasil dipublikasikan', color: 'success' })
    publishModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal mempublikasikan artikel', description: store.error || undefined, color: 'error' })
  }
}

async function handleArchive() {
  if (!selectedArticle.value) return
  try {
    await store.archive(selectedArticle.value.id)
    toast.add({ title: 'Artikel berhasil diarsipkan', color: 'success' })
    archiveModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal mengarsipkan artikel', description: store.error || undefined, color: 'error' })
  }
}

function onArticleCreated() {
  createModalOpen.value = false
  load()
}

function onArticleUpdated() {
  editModalOpen.value = false
  load()
}

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Dipublikasi', value: 'published' },
  { label: 'Diarsipkan', value: 'archived' },
]

const categoryOptions = computed(() => [
  { label: 'Semua Kategori', value: 'all' },
  ...categories.value.map(c => ({ label: c.name, value: c.id })),
])
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kelola Artikel</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Buat, edit, dan publikasikan artikel berita dan informasi.
        </p>
      </div>
      <UButton
        v-if="can('create_article')"
        icon="i-lucide-plus"
        @click="openCreate"
      >
        Buat Artikel
      </UButton>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari artikel..."
        class="w-full sm:w-64"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        value-key="value"
        placeholder="Semua Status"
        class="w-full sm:w-48"
      />
      <USelect
        v-model="categoryFilter"
        :items="categoryOptions"
        value-key="value"
        placeholder="Semua Kategori"
        class="w-full sm:w-48"
      />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.items"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
      >
        <template #title-cell="{ row }">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
              <img
                v-if="row.original.thumbnail_url"
                :src="row.original.thumbnail_url"
                :alt="row.original.title"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full w-full items-center justify-center">
                <UIcon name="i-lucide-image" class="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <span class="line-clamp-1 font-medium text-gray-900 dark:text-gray-100">
              {{ row.original.title }}
            </span>
          </div>
        </template>
        <template #status-cell="{ row }">
          <UBadge
            :color="(STATUS_COLORS[row.original.status] as any) || 'default'"
            variant="subtle"
          >
            {{ STATUS_LABELS[row.original.status] || row.original.status }}
          </UBadge>
        </template>
        <template #category_name-cell="{ row }">
          <span v-if="row.original.category_name" class="text-gray-700 dark:text-gray-300">
            {{ row.original.category_name }}
          </span>
          <span v-else class="text-gray-400">-</span>
        </template>
        <template #published_at-cell="{ row }">
          {{ formatDate(row.original.published_at) }}
        </template>
        <template #actions-cell="{ row }">
          <AppRowActions :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div v-if="totalPages > 1" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} artikel · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
      />
    </div>

    <ArticleFormModal
      v-model:open="createModalOpen"
      mode="create"
      :categories="categories"
      @created="onArticleCreated"
    />

    <ArticleFormModal
      v-model:open="editModalOpen"
      mode="edit"
      :article="selectedArticle"
      :categories="categories"
      @updated="onArticleUpdated"
    />

    <ArticleDetailModal
      v-model:open="detailModalOpen"
      :article="selectedArticleDetail"
      :loading="isDetailLoading"
    />

    <ConfirmActionModal
      v-model:open="deleteModalOpen"
      title="Hapus Artikel"
      message="Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan."
      confirm-label="Hapus"
      confirm-color="error"
      :loading="store.isSubmitting"
      @confirm="handleDelete"
    />

    <ConfirmActionModal
      v-model:open="publishModalOpen"
      title="Publikasikan Artikel"
      message="Apakah Anda yakin ingin mempublikasikan artikel ini?"
      confirm-label="Publikasikan"
      confirm-color="primary"
      :loading="store.isSubmitting"
      @confirm="handlePublish"
    />

    <ConfirmActionModal
      v-model:open="archiveModalOpen"
      title="Arsipkan Artikel"
      message="Apakah Anda yakin ingin mengarsipkan artikel ini? Artikel yang diarsipkan tidak akan tampil di halaman publik."
      confirm-label="Arsipkan"
      confirm-color="warning"
      :loading="store.isSubmitting"
      @confirm="handleArchive"
    />
  </div>
</template>

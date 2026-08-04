<script setup lang="ts">
import { useArticleStore } from '~/stores/article'
import { usePermission } from '~/composables/usePermission'
import type { SourceListItem, SourceCategoryItem } from '#shared/types/Article'

definePageMeta({ layout: 'article' })

const store = useArticleStore()
const toast = useToast()
const { can } = usePermission()

const sources = ref<SourceListItem[]>([])
const isLoading = ref(true)
const expandedSource = ref<string | null>(null)

async function loadSources() {
  isLoading.value = true
  try {
    const data = await store.fetchSources()
    sources.value = (data || []).map(s => ({ ...s, categories: s.categories ?? [] }))
  } catch (err) {
    console.error('Failed to load sources:', err)
    sources.value = []
    toast.add({ title: 'Gagal memuat sumber', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadSources()
})

async function refreshSources() {
  await loadSources()
}

function toggleExpand(id: string) {
  expandedSource.value = expandedSource.value === id ? null : id
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
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

const sourceFormOpen = ref(false)
const editingSource = ref<SourceListItem | null>(null)

function openCreateSource() {
  editingSource.value = null
  sourceFormOpen.value = true
}

function openEditSource(source: SourceListItem) {
  editingSource.value = source
  sourceFormOpen.value = true
}

async function onSourceSaved() {
  sourceFormOpen.value = false
  await refreshSources()
}

const categoryFormOpen = ref(false)
const editingCategory = ref<SourceCategoryItem | null>(null)
const activeSourceId = ref<string>('')

function openCreateCategory(sourceId: string) {
  editingCategory.value = null
  activeSourceId.value = sourceId
  categoryFormOpen.value = true
}

function openEditCategory(sourceId: string, cat: SourceCategoryItem) {
  editingCategory.value = cat
  activeSourceId.value = sourceId
  categoryFormOpen.value = true
}

async function onCategorySaved() {
  categoryFormOpen.value = false
  await refreshSources()
}

const deleteSourceOpen = ref(false)
const deleteCategoryOpen = ref(false)
const targetSource = ref<SourceListItem | null>(null)
const targetCategory = ref<SourceCategoryItem | null>(null)

const deleteSourceMessage = computed(() => `Apakah Anda yakin ingin menghapus sumber "${targetSource.value?.name}"? Semua kategori yang terkait juga akan ikut terhapus.`)
const deleteCategoryMessage = computed(() => `Apakah Anda yakin ingin menghapus kategori "${targetCategory.value?.category_key}"?`)

function confirmDeleteSource(source: SourceListItem) {
  targetSource.value = source
  deleteSourceOpen.value = true
}

async function handleDeleteSource() {
  if (!targetSource.value) return
  try {
    await store.deleteSource(targetSource.value.id)
    toast.add({ title: 'Sumber berhasil dihapus', color: 'success' })
    deleteSourceOpen.value = false
    await refreshSources()
  } catch {
    toast.add({ title: 'Gagal menghapus sumber', description: store.error || undefined, color: 'error' })
  }
}

function confirmDeleteCategory(sourceId: string, cat: SourceCategoryItem) {
  targetSource.value = { id: sourceId } as SourceListItem
  targetCategory.value = cat
  deleteCategoryOpen.value = true
}

async function handleDeleteCategory() {
  if (!targetCategory.value) return
  try {
    await store.deleteSourceCategory(targetCategory.value.id)
    toast.add({ title: 'Kategori sumber berhasil dihapus', color: 'success' })
    deleteCategoryOpen.value = false
    await refreshSources()
  } catch {
    toast.add({ title: 'Gagal menghapus kategori', description: store.error || undefined, color: 'error' })
  }
}

async function handleScrape(sourceId: string) {
  try {
    const result = await store.triggerScrape(sourceId)
    toast.add({
      title: `Scrape selesai: ${result.scraped} artikel baru`,
      description: `${result.categories.length} kategori diproses`,
      color: 'success',
    })
    await refreshSources()
  } catch {
    toast.add({ title: 'Gagal menjalankan scrape', description: store.error || undefined, color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Sumber Artikel</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Kelola sumber RSS untuk scraping artikel otomatis.
        </p>
      </div>
      <UButton
        v-if="can('manage_article_sources')"
        icon="i-lucide-plus"
        @click="openCreateSource"
      >
        Tambah Sumber
      </UButton>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <div v-else-if="!sources || sources.length === 0" class="py-12 text-center">
      <UIcon name="i-lucide-rss" class="mx-auto h-12 w-12 text-gray-400" />
      <p class="mt-4 text-gray-500 dark:text-gray-400">Belum ada sumber artikel.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="source in sources"
        :key="source.id"
        class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900"
      >
        <div
          class="flex cursor-pointer items-center justify-between p-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
          @click="toggleExpand(source.id)"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <UIcon name="i-lucide-rss" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ source.name }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ source.key }} · {{ source.base_url }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UBadge :color="source.is_active ? 'success' : 'default'" variant="subtle">
              {{ source.is_active ? 'Aktif' : 'Nonaktif' }}
            </UBadge>
            <UBadge v-if="source.auto_publish" color="primary" variant="subtle">
              Auto-publish
            </UBadge>
            <span class="text-xs text-gray-400">
              {{ source.categories.length }} kategori
            </span>
            <UIcon
              :name="expandedSource === source.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="h-5 w-5 text-gray-400"
            />
          </div>
        </div>

        <div v-if="expandedSource === source.id" class="border-t border-gray-200 dark:border-gray-700/50">
          <div class="grid gap-6 p-4 md:grid-cols-2">
            <div>
              <h4 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Info</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-gray-500">Key</dt>
                  <dd class="text-gray-900 dark:text-gray-100">{{ source.key }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-500">Base URL</dt>
                  <dd class="max-w-[200px] truncate text-right text-gray-900 dark:text-gray-100">{{ source.base_url }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-500">Auto Publish</dt>
                  <dd>{{ source.auto_publish ? 'Ya' : 'Tidak' }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-500">Terakhir Scrape</dt>
                  <dd class="text-gray-900 dark:text-gray-100">{{ formatDate(source.last_scraped_at) }}</dd>
                </div>
                <div v-if="source.selectors" class="flex justify-between">
                  <dt class="text-gray-500">Selector</dt>
                  <dd class="max-w-[200px] truncate text-right text-xs text-gray-400">
                    {{ source.selectors.content_selector || '-' }}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Kategori ({{ source.categories.length }})
                </h4>
                <UButton
                  v-if="can('manage_article_sources')"
                  size="xs"
                  icon="i-lucide-plus"
                  variant="outline"
                  @click.stop="openCreateCategory(source.id)"
                >
                  Tambah
                </UButton>
              </div>
              <div v-if="source.categories.length === 0" class="text-xs text-gray-400">
                Belum ada kategori. Tambahkan RSS feed URL spesifik.
              </div>
              <div v-else class="max-h-48 space-y-2 overflow-y-auto">
                <div
                  v-for="cat in source.categories"
                  :key="cat.id"
                  class="flex items-center justify-between rounded border border-gray-100 p-2 text-xs dark:border-gray-700"
                >
                  <div>
                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ cat.category_key }}</span>
                    <span class="ml-2 text-gray-400">{{ cat.url_suffix || cat.url_override || source.base_url }}</span>
                    <span class="ml-1 text-gray-400">· limit: {{ cat.article_limit }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <UButton
                      v-if="can('manage_article_sources')"
                      size="xs"
                      icon="i-lucide-pencil"
                      variant="ghost"
                      square
                      @click.stop="openEditCategory(source.id, cat)"
                    />
                    <UButton
                      v-if="can('manage_article_sources')"
                      size="xs"
                      icon="i-lucide-trash-2"
                      variant="ghost"
                      color="error"
                      square
                      @click.stop="confirmDeleteCategory(source.id, cat)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2 border-t border-gray-100 p-4 dark:border-gray-700/50">
            <UButton
              v-if="can('manage_article_sources')"
              size="sm"
              icon="i-lucide-pencil"
              variant="outline"
              @click="openEditSource(source)"
            >
              Edit
            </UButton>
            <UButton
              v-if="can('manage_article_sources')"
              size="sm"
              icon="i-lucide-download"
              color="primary"
              :loading="store.isSubmitting"
              @click="handleScrape(source.id)"
            >
              Scrape Sekarang
            </UButton>
            <UButton
              v-if="can('manage_article_sources')"
              size="sm"
              icon="i-lucide-trash-2"
              color="error"
              variant="outline"
              @click="confirmDeleteSource(source)"
            >
              Hapus
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <SourceFormModal
      v-model:open="sourceFormOpen"
      :source="editingSource"
      @saved="onSourceSaved"
    />

    <SourceCategoryFormModal
      v-model:open="categoryFormOpen"
      :category="editingCategory"
      :source-id="activeSourceId"
      @saved="onCategorySaved"
    />

    <ConfirmActionModal
      v-model:open="deleteSourceOpen"
      title="Hapus Sumber"
      :message="deleteSourceMessage"
      confirm-label="Hapus"
      confirm-color="error"
      :loading="store.isSubmitting"
      @confirm="handleDeleteSource"
    />

    <ConfirmActionModal
      v-model:open="deleteCategoryOpen"
      title="Hapus Kategori Sumber"
      :message="deleteCategoryMessage"
      confirm-label="Hapus"
      confirm-color="error"
      :loading="store.isSubmitting"
      @confirm="handleDeleteCategory"
    />
  </div>
</template>

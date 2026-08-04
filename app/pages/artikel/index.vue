<script setup lang="ts">
import { useArticleStore } from '~/stores/article'
import type { ArticleListItem, ArticleDetail } from '#shared/types/Article'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'default' })

const store = useArticleStore()

const page = ref(1)
const limit = ref(9)
const search = ref('')
const featuredArticle = ref<ArticleDetail | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
watch(page, () => load())

async function load() {
  try {
    await store.fetchList({
      page: page.value,
      limit: limit.value,
      status: 'published',
      q: search.value || undefined,
      sort_by: 'published_at',
      sort_type: 'DESC',
    })
  } catch {
    // error set in store
  }
}

async function loadFeatured() {
  try {
    await store.fetchList({
      page: 1,
      limit: 1,
      status: 'published',
      sort_by: 'published_at',
      sort_type: 'DESC',
    })
    if (store.items.length > 0) {
      featuredArticle.value = await store.fetchDetail(store.items[0].id)
    }
  } catch {
    // ignore
  }
}

onMounted(async () => {
  await Promise.all([load(), loadFeatured()])
})

const totalPages = computed(() => store.meta?.total_pages ?? 1)
const totalItems = computed(() => store.meta?.total ?? 0)

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function truncate(text: string, maxLength: number) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Artikel</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Berita dan informasi terkini dari pesantren.
      </p>
    </div>

    <div v-if="featuredArticle" class="mb-8">
      <NuxtLink
        :to="`/artikel/${featuredArticle.id}`"
        class="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-700/50 dark:bg-gray-900"
      >
        <div class="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            v-if="featuredArticle.thumbnail_url"
            :src="featuredArticle.thumbnail_url"
            :alt="featuredArticle.title"
            class="h-full w-full object-cover transition group-hover:scale-105"
          />
          <div v-else class="flex h-full w-full items-center justify-center">
            <UIcon name="i-lucide-image" class="h-12 w-12 text-gray-400" />
          </div>
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <h2 class="text-xl font-bold text-white md:text-2xl">{{ featuredArticle.title }}</h2>
          </div>
        </div>
        <div class="p-4">
          <p v-if="featuredArticle.summary" class="text-sm text-gray-700 dark:text-gray-300">
            {{ featuredArticle.summary }}
          </p>
          <div class="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-user" class="h-3.5 w-3.5" />
              {{ featuredArticle.author }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="h-3.5 w-3.5" />
              {{ formatDate(featuredArticle.published_at) }}
            </span>
            <span v-if="featuredArticle.category_name" class="rounded-full bg-teal-50 px-2 py-0.5 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              {{ featuredArticle.category_name }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div class="mb-6">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari artikel..."
        size="lg"
        class="w-full"
      />
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="article in store.items"
        :key="article.id"
        :to="`/artikel/${article.id}`"
        class="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-700/50 dark:bg-gray-900"
      >
        <div class="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            v-if="article.thumbnail_url"
            :src="article.thumbnail_url"
            :alt="article.title"
            class="h-full w-full object-cover transition group-hover:scale-105"
          />
          <div v-else class="flex h-full w-full items-center justify-center">
            <UIcon name="i-lucide-image" class="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div class="p-4">
          <h3 class="line-clamp-2 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-teal-600">
            {{ article.title }}
          </h3>
          <p v-if="article.summary" class="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {{ truncate(article.summary, 100) }}
          </p>
          <div class="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-user" class="h-3 w-3" />
              {{ article.author }}
            </span>
            <span>{{ formatDate(article.published_at) }}</span>
          </div>
          <span v-if="article.category_name" class="mt-2 inline-block rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            {{ article.category_name }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <div v-if="store.items.length === 0 && !store.isLoading" class="py-12 text-center">
      <UIcon name="i-lucide-file-text" class="mx-auto h-12 w-12 text-gray-400" />
      <p class="mt-4 text-gray-500 dark:text-gray-400">Belum ada artikel yang dipublikasikan.</p>
    </div>

    <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center">
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :show-edges="true"
      />
    </div>
  </div>
</template>

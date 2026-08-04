<script setup lang="ts">
import { useArticleStore } from '~/stores/article'
import type { ArticleDetail } from '#shared/types/Article'

definePageMeta({ layout: 'default' })

const route = useRoute()
const store = useArticleStore()

const article = ref<ArticleDetail | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

async function loadArticle() {
  const id = route.params.id as string
  isLoading.value = true
  error.value = null
  try {
    article.value = await store.fetchDetail(id)
  } catch (err) {
    error.value = 'Artikel tidak ditemukan atau tidak dapat dimuat.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadArticle)

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

useHead(() => ({
  title: article.value ? `${article.value.title} - SIPON` : 'Artikel - SIPON',
  meta: [
    { name: 'description', content: article.value?.summary || '' },
  ],
}))
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <div v-else-if="error" class="py-16 text-center">
      <UIcon name="i-lucide-alert-circle" class="mx-auto h-12 w-12 text-gray-400" />
      <p class="mt-4 text-gray-500 dark:text-gray-400">{{ error }}</p>
      <UButton to="/artikel" variant="outline" class="mt-6">
        Kembali ke Daftar Artikel
      </UButton>
    </div>

    <article v-else-if="article" class="space-y-6">
      <NuxtLink
        to="/artikel"
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Kembali ke Daftar Artikel
      </NuxtLink>

      <header class="space-y-4">
        <div v-if="article.category_name" class="flex items-center gap-2">
          <span class="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            {{ article.category_name }}
          </span>
        </div>

        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
          {{ article.title }}
        </h1>

        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1.5">
            <UIcon name="i-lucide-user" class="h-4 w-4" />
            {{ article.author }}
          </span>
          <span class="flex items-center gap-1.5">
            <UIcon name="i-lucide-calendar" class="h-4 w-4" />
            {{ formatDate(article.published_at) }}
          </span>
          <span class="flex items-center gap-1.5">
            <UIcon name="i-lucide-eye" class="h-4 w-4" />
            {{ article.view_count }} views
          </span>
        </div>
      </header>

      <div v-if="article.thumbnail_url" class="overflow-hidden rounded-lg">
        <img
          :src="article.thumbnail_url"
          :alt="article.title"
          class="h-auto w-full object-cover"
        />
      </div>

      <div v-if="article.summary" class="rounded-lg border-l-4 border-teal-500 bg-teal-50/50 p-4 dark:border-teal-400 dark:bg-teal-950/30">
        <p class="text-sm italic text-gray-700 dark:text-gray-300">
          {{ article.summary }}
        </p>
      </div>

      <div class="prose prose-lg max-w-none dark:prose-invert">
        <div class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {{ article.content }}
        </div>
      </div>

      <footer class="border-t border-gray-200 pt-6 dark:border-gray-700/50">
        <div class="flex flex-wrap items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span>Dibuat: {{ formatDateTime(article.created_at) }}</span>
          <span v-if="article.updated_at && article.updated_at !== article.created_at">
            Diperbarui: {{ formatDateTime(article.updated_at) }}
          </span>
        </div>
      </footer>

      <div class="border-t border-gray-200 pt-6 dark:border-gray-700/50">
        <UButton to="/artikel" variant="outline" icon="i-lucide-arrow-left">
          Kembali ke Daftar Artikel
        </UButton>
      </div>
    </article>
  </div>
</template>

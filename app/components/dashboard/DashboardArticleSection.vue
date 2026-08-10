<script setup lang="ts">
import { useArticleStore } from '~/stores/article'
import type { ArticleListItem } from '#shared/types/Article'

const articleStore = useArticleStore()

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
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Artikel Terbaru</h3>
      <NuxtLink to="/artikel" class="text-sm text-teal-600 hover:underline dark:text-teal-400">
        Lihat Semua
      </NuxtLink>
    </div>

    <div v-if="articleStore.items.length === 0" class="py-8 text-center">
      <UIcon name="i-lucide-file-text" class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Belum ada artikel yang dipublikasikan.</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="article in articleStore.items"
        :key="article.id"
        :to="`/artikel/${article.id}`"
        class="group overflow-hidden rounded-lg border border-gray-200 transition hover:shadow-md dark:border-gray-700/50"
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
        <div class="p-3">
          <h4 class="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-teal-600 dark:text-gray-100 dark:group-hover:text-teal-400">
            {{ article.title }}
          </h4>
          <div class="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{{ formatDate(article.published_at) }}</span>
            <span v-if="article.category_name" class="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              {{ article.category_name }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

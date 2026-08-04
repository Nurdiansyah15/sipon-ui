<script setup lang="ts">
import type { ArticleDetail } from '#shared/types/Article'

defineProps<{
  open: boolean
  article: ArticleDetail | null
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

function close() {
  emit('update:open', false)
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  published: 'Dipublikasi',
  archived: 'Diarsipkan',
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="max-h-[90vh] overflow-y-auto p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Detail Artikel</h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="close"
          />
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-teal-600" />
        </div>

        <div v-else-if="article" class="space-y-4">
          <div v-if="article.thumbnail_url" class="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <img :src="article.thumbnail_url" :alt="article.title" class="h-full w-full object-cover" />
          </div>

          <div>
            <UBadge
              :color="article.status === 'published' ? 'success' : article.status === 'archived' ? 'warning' : 'default'"
              variant="subtle"
            >
              {{ statusLabels[article.status] || article.status }}
            </UBadge>
            <UBadge v-if="article.is_featured" color="primary" variant="subtle" class="ml-2">
              Unggulan
            </UBadge>
          </div>

          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ article.title }}</h2>
          </div>

          <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-user" class="h-4 w-4" />
              {{ article.author }}
            </span>
            <span v-if="article.category_name" class="flex items-center gap-1">
              <UIcon name="i-lucide-tag" class="h-4 w-4" />
              {{ article.category_name }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-eye" class="h-4 w-4" />
              {{ article.view_count }} views
            </span>
            <a
              v-if="article.original_url"
              :href="article.original_url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              <UIcon name="i-lucide-external-link" class="h-4 w-4" />
              Artikel Asli
            </a>
          </div>

          <div class="flex flex-wrap items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>Dibuat: {{ formatDate(article.created_at) }}</span>
            <span v-if="article.published_at">Dipublikasi: {{ formatDate(article.published_at) }}</span>
          </div>

          <div v-if="article.summary" class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Ringkasan</p>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ article.summary }}</p>
          </div>

          <div class="prose prose-sm max-w-none dark:prose-invert">
            <div class="article-content text-gray-700 dark:text-gray-300" v-html="article.content" />
          </div>
        </div>

        <div v-else class="py-12 text-center">
          <p class="text-gray-500 dark:text-gray-400">Gagal memuat detail artikel.</p>
        </div>

        <div class="mt-6 flex justify-end">
          <UButton color="neutral" variant="ghost" @click="close">Tutup</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

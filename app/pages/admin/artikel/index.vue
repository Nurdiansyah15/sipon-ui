<script setup lang="ts">
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'article' })

const { can } = usePermission()

const canCreateArticle = computed(() => can('create_article'))
const canManageCategory = computed(() => can('manage_article_category'))
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Artikel</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Kelola artikel berita, informasi, dan konten publikasi pesantren.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FeatureModuleCard
        v-if="canCreateArticle"
        title="Kelola Artikel"
        description="Buat, edit, dan publikasikan artikel berita dan informasi pesantren."
        icon="i-lucide-file-text"
        to="/admin/artikel/artikel"
      />
      <FeatureModuleCard
        v-if="canManageCategory"
        title="Kategori"
        description="Kelola kategori artikel untuk mengorganisir konten berdasarkan topik."
        icon="i-lucide-tags"
        to="/admin/artikel/kategori"
      />
    </div>
  </div>
</template>

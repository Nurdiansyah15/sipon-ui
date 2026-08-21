<script setup lang="ts">
const route = useRoute()

const links = [
  { label: 'Dasbor', icon: 'i-lucide-gauge', to: '/admin/artikel' },
  { label: 'Kelola Artikel', icon: 'i-lucide-file-text', to: '/admin/artikel/artikel' },
  { label: 'Kategori', icon: 'i-lucide-tags', to: '/admin/artikel/kategori' },
  { label: 'Sumber', icon: 'i-lucide-rss', to: '/admin/artikel/sumber' },
]

function isActive(to: string) {
  if (to === '/admin/artikel') return route.path === '/admin/artikel'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
    <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
      <NuxtLink to="/dashboard" class="flex shrink-0 items-center gap-2">
        <img src="/logo.png" alt="Logo" class="h-8 w-8 rounded-full object-cover" />
      </NuxtLink>

      <NuxtLink to="/admin" class="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        <span class="hidden md:inline">Portal</span>
      </NuxtLink>

      <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Artikel</span>

      <div class="hidden items-center gap-1 md:flex">
        <ULink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="isActive(link.to)
            ? 'flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1.5 text-sm font-medium text-white dark:bg-teal-500'
            : 'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
        >
          <UIcon :name="link.icon" class="h-4 w-4" />
          {{ link.label }}
        </ULink>
      </div>

      <div class="flex-1" />

      <AppUserMenu />
    </div>
  </nav>
</template>

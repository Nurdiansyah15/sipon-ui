<script setup lang="ts">
const route = useRoute()

const items = [
  { label: 'Dasbor', icon: 'i-lucide-gauge', to: '/admin/artikel' },
  { label: 'Artikel', icon: 'i-lucide-file-text', to: '/admin/artikel/artikel' },
  { label: 'Kategori', icon: 'i-lucide-tags', to: '/admin/artikel/kategori' },
]

function isActive(to: string) {
  if (to === '/admin/artikel') return route.path === '/admin/artikel'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden dark:border-gray-700/50 dark:bg-gray-900">
    <div class="flex items-center justify-around py-2">
      <ULink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 px-3 py-1"
      >
        <UIcon
          :name="item.icon"
          :class="isActive(item.to) ? 'h-5 w-5 text-gray-700 dark:text-gray-300' : 'h-5 w-5 text-gray-400 dark:text-gray-500'"
        />
        <span
          :class="isActive(item.to) ? 'text-[10px] font-medium text-gray-700 dark:text-gray-300' : 'text-[10px] text-gray-400 dark:text-gray-500'"
        >
          {{ item.label }}
        </span>
      </ULink>
    </div>
  </nav>
</template>

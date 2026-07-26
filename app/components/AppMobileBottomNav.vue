<script setup lang="ts">
const route = useRoute()

const items = [
  { label: 'Dasbor', icon: 'i-lucide-home', to: '/dashboard' },
  { label: 'Aplikasi', icon: 'i-lucide-apps', to: '#' },
  { label: 'Artikel', icon: 'i-lucide-globe', to: '#' },
  { label: 'Umpan Balik', icon: 'i-lucide-message-square', to: '#' },
]

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
    <div class="flex items-center justify-around py-2">
      <ULink
        v-for="item in items"
        :key="item.label"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 px-3 py-1"
      >
        <UIcon
          :name="item.icon"
          :class="isActive(item.to) ? 'h-5 w-5 text-teal-600' : 'h-5 w-5 text-gray-400'"
        />
        <span
          :class="isActive(item.to) ? 'text-[10px] font-medium text-teal-600' : 'text-[10px] text-gray-400'"
        >
          {{ item.label }}
        </span>
      </ULink>
    </div>
  </nav>
</template>

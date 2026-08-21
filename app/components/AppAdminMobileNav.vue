<script setup lang="ts">
const route = useRoute()

const items = [
  { label: 'Dasbor', icon: 'i-lucide-gauge', to: '/admin' },
  { label: 'User', icon: 'i-lucide-users', to: '/admin/users' },
  { label: 'Role', icon: 'i-lucide-shield', to: '/admin/roles' },
  { label: 'Santri', icon: 'i-lucide-graduation-cap', to: '/admin/kesantrian' },
  { label: 'Aset', icon: 'i-lucide-folder-open', to: '/admin/dokumen-aset' },
  { label: 'Scope', icon: 'i-lucide-tags', to: '/admin/scopes' },
  { label: 'Notif', icon: 'i-lucide-megaphone', to: '/admin/notifikasi' },
]

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
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
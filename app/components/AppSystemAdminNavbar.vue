<script setup lang="ts">
const route = useRoute()

const links = [
  { label: 'Dasbor', icon: 'i-lucide-gauge', to: '/system-admin' },
  { label: 'Kelola User', icon: 'i-lucide-users', to: '/system-admin/users' },
  { label: 'Kelola Role', icon: 'i-lucide-shield', to: '/system-admin/roles' },
]

function isActive(to: string) {
  if (to === '/system-admin') return route.path === '/system-admin'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
    <div class="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
      <NuxtLink to="/dashboard" class="flex shrink-0 items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-teal-600">
          <div class="flex flex-col items-center gap-0.5">
            <span class="block h-1.5 w-1.5 rounded-full bg-yellow-400" />
            <span class="block h-1.5 w-1.5 rounded-full bg-teal-500" />
            <span class="block h-1.5 w-1.5 rounded-full bg-green-500" />
          </div>
        </div>
        <span class="text-lg font-extrabold tracking-tight text-gray-900 dark:text-gray-100">Ikhlas</span>
      </NuxtLink>

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

      <div class="flex items-center gap-1">
        <UButton
          variant="ghost"
          square
          class="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <UIcon name="i-lucide-bell" class="h-5 w-5" />
        </UButton>
        <UButton
          variant="ghost"
          square
          class="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <UIcon name="i-lucide-grid-3x3" class="h-5 w-5" />
        </UButton>
        <AppUserMenu />
      </div>
    </div>
  </nav>
</template>
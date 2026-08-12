<script setup lang="ts">
import { usePermission } from '~/composables/usePermission'

const route = useRoute()
const { can } = usePermission()
const { collapsed, toggleCollapsed } = useAkademikSidebar()
const { isOperasionalRoute } = useAkademikPeriodContext()

const sidebarOpen = ref(false)

interface NavItem {
  label: string
  icon: string
  to: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const dashboardItem: NavItem = { label: 'Dashboard', icon: 'i-lucide-gauge', to: '/admin/akademik' }

const masterDataItems: NavItem[] = [
  { label: 'Program', icon: 'i-lucide-graduation-cap', to: '/admin/akademik/program' },
  { label: 'Periode Akademik', icon: 'i-lucide-calendar-range', to: '/admin/akademik/periode' },
  { label: 'Kegiatan', icon: 'i-lucide-trophy', to: '/admin/akademik/kegiatan' },
  { label: 'Pengaturan', icon: 'i-lucide-settings', to: '/admin/akademik/settings' },
]

// Menu operasional & pelaksanaan dipindah ke landing page
// "/admin/akademik/operasional" dan dikontrol oleh pemilihan periode kerja.
// const operasionalItems: NavItem[] = [
//   { label: 'Herregistrasi', icon: 'i-lucide-clipboard-check', to: '/admin/akademik/herregistrasi' },
//   { label: 'Aktivasi Kegiatan', icon: 'i-lucide-power', to: '/admin/akademik/aktivasi' },
//   { label: 'Jadwal', icon: 'i-lucide-calendar-clock', to: '/admin/akademik/jadwal' },
// ]
//
// const pelaksanaanItems: NavItem[] = [
//   { label: 'Sesi', icon: 'i-lucide-users', to: '/admin/akademik/sesi' },
// ]

const sections = computed<NavSection[]>(() => {
  if (!can('manage_akademik')) return []
  return [
    { title: 'Master', items: masterDataItems },
    // Operasional & Pelaksanaan kini dikelola lewat pemilihan periode kerja
    // (landing page /admin/akademik/operasional).
    // { title: 'Operasional', items: operasionalItems },
    // { title: 'Pelaksanaan', items: pelaksanaanItems },
  ]
})

function isActive(to: string) {
  if (to === '/admin/akademik') return route.path === '/admin/akademik'
  return route.path === to || route.path.startsWith(to + '/')
}

watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div>
    <nav :class="collapsed ? 'sticky top-0 z-50 border-b border-gray-200 bg-white md:ml-16 dark:border-gray-700/50 dark:bg-gray-900' : 'sticky top-0 z-50 border-b border-gray-200 bg-white md:ml-64 dark:border-gray-700/50 dark:bg-gray-900'">
      <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <NuxtLink to="/dashboard" class="flex shrink-0 items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-teal-600">
            <div class="flex flex-col items-center gap-0.5">
              <span class="block h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span class="block h-1.5 w-1.5 rounded-full bg-teal-500" />
              <span class="block h-1.5 w-1.5 rounded-full bg-green-500" />
            </div>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin" class="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
          <span class="hidden md:inline">Portal</span>
        </NuxtLink>

        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Akademik</span>

        <div class="flex-1" />

        <AppAkademikPeriodSelector v-if="isOperasionalRoute" class="mr-2 hidden sm:block" />

        <button
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-gray-800"
          @click="sidebarOpen = !sidebarOpen"
        >
          <UIcon :name="sidebarOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="h-4 w-4" />
          <span>Menu</span>
        </button>

        <AppUserMenu />
      </div>
    </nav>

    <div :class="collapsed
      ? 'hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-16 md:flex-col md:border-r md:border-gray-200 md:bg-white md:dark:border-gray-700/50 md:dark:bg-gray-900'
      : 'hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col md:border-r md:border-gray-200 md:bg-white md:dark:border-gray-700/50 md:dark:bg-gray-900'">
      <div :class="collapsed ? 'sticky top-0 flex h-14 items-center justify-center border-b border-gray-200 dark:border-gray-700/50' : 'sticky top-0 flex h-14 items-center gap-2 border-b border-gray-200 px-4 dark:border-gray-700/50'">
        <template v-if="!collapsed">
          <NuxtLink to="/dashboard" class="flex shrink-0 items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-teal-600">
              <div class="flex flex-col items-center gap-0.5">
                <span class="block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <span class="block h-1.5 w-1.5 rounded-full bg-teal-500" />
                <span class="block h-1.5 w-1.5 rounded-full bg-green-500" />
              </div>
            </div>
          </NuxtLink>
          <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Akademik</span>
          <div class="flex-1" />
        </template>
        <button
          class="flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          :title="collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'"
          @click="toggleCollapsed"
        >
          <UIcon :name="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'" class="h-4 w-4" />
        </button>
      </div>
      <div :class="collapsed ? 'flex flex-1 flex-col items-center gap-6 overflow-y-auto py-4' : 'flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4'">
        <NuxtLink
          :to="dashboardItem.to"
          :title="collapsed ? dashboardItem.label : undefined"
          :class="[isActive(dashboardItem.to)
            ? 'flex items-center rounded-lg bg-teal-600 py-2 text-sm font-medium text-white dark:bg-teal-500'
            : 'flex items-center rounded-lg py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800', collapsed ? 'w-10 justify-center' : 'w-full gap-2 px-3']"
        >
          <UIcon :name="dashboardItem.icon" class="h-4 w-4 shrink-0" />
          <span v-if="!collapsed">{{ dashboardItem.label }}</span>
        </NuxtLink>

        <div v-for="section in sections" :key="section.title" :class="collapsed ? 'flex w-full flex-col items-center gap-1' : 'flex w-full flex-col gap-1'">
          <span v-if="!collapsed" class="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{{ section.title }}</span>
          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            :title="collapsed ? item.label : undefined"
            :class="[isActive(item.to)
              ? 'flex items-center rounded-lg bg-teal-600 py-2 text-sm font-medium text-white dark:bg-teal-500'
              : 'flex items-center rounded-lg py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800', collapsed ? 'w-10 justify-center' : 'w-full gap-2 px-3']"
          >
            <UIcon :name="item.icon" class="h-4 w-4 shrink-0" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 md:hidden"
      @click="sidebarOpen = false"
    />

    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out md:hidden dark:border-gray-700/50 dark:bg-gray-900',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex h-14 items-center gap-2 border-b border-gray-200 px-4 dark:border-gray-700/50">
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-teal-600">
          <div class="flex flex-col items-center gap-0.5">
            <span class="block h-1.5 w-1.5 rounded-full bg-yellow-400" />
            <span class="block h-1.5 w-1.5 rounded-full bg-teal-500" />
            <span class="block h-1.5 w-1.5 rounded-full bg-green-500" />
          </div>
        </div>
        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Akademik</span>
      </div>
      <div class="flex flex-col gap-6 px-4 py-4">
        <AppAkademikPeriodSelector v-if="isOperasionalRoute" class="sm:hidden" />

        <NuxtLink
          :to="dashboardItem.to"
          :class="isActive(dashboardItem.to)
            ? 'flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white dark:bg-teal-500'
            : 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
        >
          <UIcon :name="dashboardItem.icon" class="h-4 w-4" />
          {{ dashboardItem.label }}
        </NuxtLink>

        <div v-for="section in sections" :key="section.title" class="flex flex-col gap-1">
          <span class="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{{ section.title }}</span>
          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            :class="isActive(item.to)
              ? 'flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white dark:bg-teal-500'
              : 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
          >
            <UIcon :name="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </NuxtLink>
        </div>
      </div>
    </aside>
  </div>
</template>

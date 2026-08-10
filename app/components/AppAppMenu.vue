<script setup lang="ts">
import { useAppModules } from '~/composables/useAppModules'

const { publicApps, visibleAdminApps } = useAppModules()
</script>

<template>
  <UPopover :content="{ side: 'bottom', align: 'end', sideOffset: 4 }">
    <UButton
      variant="ghost"
      square
      class="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
    >
      <UIcon name="i-lucide-grid-3x3" class="h-5 w-5" />
    </UButton>

    <template #content>
      <div class="w-40 p-3">
        <!-- Lapisan publik -->
        <div class="grid grid-cols-3 gap-1">
          <UTooltip
            v-for="app in publicApps"
            :key="app.to"
            :text="app.title"
            :content="{ side: 'bottom' }"
          >
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-teal-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-teal-400"
              @click="navigateTo(app.to)"
            >
              <UIcon :name="app.icon" class="h-5 w-5" />
            </button>
          </UTooltip>
        </div>

        <!-- Lapisan admin (hanya jika ada permission) -->
        <div
          v-if="visibleAdminApps.length > 0"
          class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700"
        >
          <div class="grid grid-cols-3 gap-1">
            <UTooltip
              v-for="app in visibleAdminApps"
              :key="app.to"
              :text="app.title"
              :content="{ side: 'bottom' }"
            >
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-teal-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-teal-400"
                @click="navigateTo(app.to)"
              >
                <UIcon :name="app.icon" class="h-5 w-5" />
              </button>
            </UTooltip>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

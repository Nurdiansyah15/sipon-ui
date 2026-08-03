<script setup lang="ts">
import type { SettingResponse } from '#shared/types/Psb'

defineProps<{
  setting: SettingResponse
}>()

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    <div class="mb-3 flex items-center gap-3">
      <UIcon name="i-lucide-calendar-range" class="h-5 w-5 text-teal-600" />
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ setting.name }}</h3>
        <p class="text-xs text-gray-400">{{ formatDate(setting.start_period) }} &mdash; {{ formatDate(setting.end_period) }}</p>
      </div>
      <UBadge :color="setting.status === 'active' ? 'success' : 'neutral'" variant="subtle" class="ml-auto">
        {{ setting.status === 'active' ? 'Aktif' : 'Ditutup' }}
      </UBadge>
    </div>

    <div v-if="setting.quota && Object.keys(setting.quota).length > 0" class="mt-3 space-y-1 border-t border-gray-100 pt-3 dark:border-gray-800">
      <div v-for="(value, key) in setting.quota" :key="key" class="flex items-center justify-between text-sm">
        <span class="text-gray-400">{{ key.replace('_', ' ').toUpperCase() }}</span>
        <span class="text-gray-900 dark:text-gray-100">{{ value }} kuota</span>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-gray-800">
      <span class="text-gray-400">Biaya Pendaftaran</span>
      <span class="font-semibold text-gray-900 dark:text-gray-100">Rp {{ setting.reg_fee.toLocaleString('id-ID') }}</span>
    </div>
  </div>
</template>

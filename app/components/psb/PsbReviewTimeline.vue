<script setup lang="ts">
import type { ReviewResponse } from '#shared/types/Psb'

const props = defineProps<{
  items: ReviewResponse[]
  loading?: boolean
}>()

const actionLabel: Record<string, string> = {
  perlu_revisi: 'Meminta Revisi',
  ditolak: 'Menolak',
  diterima: 'Menerima',
}

const actionColor: Record<string, string> = {
  perlu_revisi: 'warning',
  ditolak: 'error',
  diterima: 'success',
}

const stageLabel: Record<string, string> = {
  pendaftaran: 'Pendaftaran',
  daftar_ulang: 'Daftar Ulang',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="space-y-3">
      <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
    </div>

    <div v-else-if="items.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
      Belum ada riwayat review.
    </div>

    <div v-else class="relative">
      <div class="absolute bottom-0 left-4 top-0 w-px bg-gray-200 dark:bg-gray-700" />
      <div v-for="item in items" :key="item.id" class="relative flex gap-4 pb-6 last:pb-0">
        <div :class="['relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-gray-900', `bg-${actionColor[item.action]}-100 dark:bg-${actionColor[item.action]}-900`]">
          <UIcon :name="item.action === 'diterima' ? 'i-lucide-check' : item.action === 'ditolak' ? 'i-lucide-x' : 'i-lucide-pencil'" :class="['h-4 w-4', `text-${actionColor[item.action]}-600 dark:text-${actionColor[item.action]}-400`]" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <UBadge :color="actionColor[item.action]" variant="subtle" size="sm">
              {{ actionLabel[item.action] || item.action }}
            </UBadge>
            <span class="text-xs text-gray-400">{{ stageLabel[item.stage] || item.stage }}</span>
          </div>
          <p v-if="item.notes" class="mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{{ item.notes }}</p>
          <p class="mt-1 text-xs text-gray-400">{{ formatDate(item.created_at) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SantriBillingAssignment } from '#shared/types/Keuangan'
import type { SantriItem } from '#shared/types/Kesantrian'

const props = defineProps<{
  open: boolean
  santri?: SantriItem | null
  assignments: SantriBillingAssignment[]
  schemeName: (schemeId: string) => string
  isActive: (a: SantriBillingAssignment) => boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Riwayat Skema</h3>
            <p v-if="santri" class="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {{ santri.fullname ?? santri.username }}<template v-if="santri.nis"> ({{ santri.nis }})</template>
            </p>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="emit('update:open', false)"
          />
        </div>

        <div v-if="assignments.length === 0" class="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Santri ini belum pernah ditetapkan skema.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="a in assignments"
            :key="a.id"
            class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700/50 dark:bg-gray-900"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ a.billing_scheme?.name ?? schemeName(a.billing_scheme_id) }}
              </span>
              <UBadge
                :color="isActive(a) ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ isActive(a) ? 'Aktif' : 'Berakhir' }}
              </UBadge>
            </div>
            <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {{ formatDate(a.effective_from) }}
                <template v-if="a.effective_until">– {{ formatDate(a.effective_until) }}</template>
                <template v-else>– sekarang</template>
              </span>
              <span v-if="a.created_at" class="text-gray-400 dark:text-gray-500">· ditetapkan {{ formatDate(a.created_at) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
          <UButton color="neutral" variant="outline" @click="emit('update:open', false)">
            Tutup
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

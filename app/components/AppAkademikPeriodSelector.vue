<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAkademikPeriodContext } from '~/composables/useAkademikPeriodContext'
import { useAkademikStore } from '~/stores/akademik'

const store = useAkademikStore()
const { selectedPeriodId, selectedPeriod, setPeriod, clearPeriod, loadPeriods } = useAkademikPeriodContext()

onMounted(() => {
  loadPeriods()
})

const items = computed<DropdownMenuItem[]>(() => {
  const list: DropdownMenuItem[] = store.periods.map((p) => ({
    label: `${p.code} — ${p.name}`,
    icon: p.id === selectedPeriodId.value ? 'i-lucide-check' : 'i-lucide-calendar-range',
    onSelect: () => setPeriod(p.id),
  }))
  if (selectedPeriodId.value) {
    list.push({ type: 'separator' })
    list.push({ label: 'Hapus pilihan periode', icon: 'i-lucide-x', color: 'error', onSelect: () => clearPeriod() })
  }
  return list
})

const label = computed(() => {
  if (selectedPeriod.value) {
    return `${selectedPeriod.value.code} — ${selectedPeriod.value.name}`
  }
  return 'Pilih Periode'
})

const empty = computed(() => store.periods.length === 0)
</script>

<template>
  <div class="flex items-center">
    <UTooltip
      v-if="empty"
      text="Belum ada periode akademik. Buat di Master › Periode Akademik."
      :content="{ side: 'bottom' }"
    >
      <span
        class="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-400 dark:border-gray-600 dark:text-gray-500"
      >
        <UIcon name="i-lucide-calendar-range" class="h-4 w-4" />
        Belum ada periode
      </span>
    </UTooltip>

    <UDropdown v-else :items="items" :content="{ align: 'end' }">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition"
        :class="selectedPeriod
          ? 'border-teal-600 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-950 dark:text-teal-300'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'"
      >
        <UIcon name="i-lucide-calendar-range" class="h-4 w-4" />
        <span class="max-w-56 truncate">{{ label }}</span>
        <UIcon name="i-lucide-chevron-down" class="h-3.5 w-3.5 opacity-70" />
      </button>
    </UDropdown>
  </div>
</template>

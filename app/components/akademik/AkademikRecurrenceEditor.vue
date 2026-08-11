<script setup lang="ts">
import type { ActivityScheduleType, DayOfWeek, YearlyDate } from '#shared/types/Akademik'

const props = defineProps<{
  type: ActivityScheduleType
  weeklyDays: DayOfWeek[]
  monthlyDays: number[]
  yearlyDates: YearlyDate[]
}>()

const emit = defineEmits<{
  'update:weeklyDays': [DayOfWeek[]]
  'update:monthlyDays': [number[]]
  'update:yearlyDates': [YearlyDate[]]
}>()

// ── Weekly ───────────────────────────────────────────────────────────────────

// ── Monthly ──────────────────────────────────────────────────────────────────
function addMonthlyDay() {
  emit('update:monthlyDays', [...props.monthlyDays, 1])
}

function setMonthlyDay(idx: number, value: string) {
  const v = Number.parseInt(value, 10)
  const next = props.monthlyDays.map((d, i) => (i === idx ? (Number.isNaN(v) ? 1 : Math.min(31, Math.max(1, v))) : d))
  emit('update:monthlyDays', next)
}

function removeMonthlyDay(idx: number) {
  emit('update:monthlyDays', props.monthlyDays.filter((_, i) => i !== idx))
}

// ── Yearly ───────────────────────────────────────────────────────────────────
function addYearlyDate() {
  emit('update:yearlyDates', [...props.yearlyDates, { month: 1, day: 1 }])
}

function setYearlyMonth(idx: number, value: string) {
  const v = Number.parseInt(value, 10)
  const month = Number.isNaN(v) ? 1 : Math.min(12, Math.max(1, v))
  emit('update:yearlyDates', props.yearlyDates.map((d, i) => (i === idx ? { ...d, month } : d)))
}

function setYearlyDay(idx: number, value: string) {
  const v = Number.parseInt(value, 10)
  const day = Number.isNaN(v) ? 1 : Math.min(31, Math.max(1, v))
  emit('update:yearlyDates', props.yearlyDates.map((d, i) => (i === idx ? { ...d, day } : d)))
}

function removeYearlyDate(idx: number) {
  emit('update:yearlyDates', props.yearlyDates.filter((_, i) => i !== idx))
}
</script>

<template>
  <div class="space-y-3">
    <!-- Weekly -->
    <div v-if="type === 'weekly'" class="space-y-2">
      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Hari dalam seminggu</p>
      <AkademikDayOfWeekPicker
        :model-value="weeklyDays"
        @update:model-value="emit('update:weeklyDays', $event)"
      />
    </div>

    <!-- Monthly -->
    <div v-if="type === 'monthly'" class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Tanggal dalam bulan (1-31)</p>
        <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-plus" @click="addMonthlyDay">
          Tambah
        </UButton>
      </div>
      <div v-if="monthlyDays.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
        Belum ada tanggal — tambahkan minimal satu.
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(day, idx) in monthlyDays"
          :key="idx"
          class="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-700"
        >
          <UInput
            :model-value="String(day)"
            type="number"
            min="1"
            max="31"
            class="w-20"
            size="sm"
            @update:model-value="v => setMonthlyDay(idx, String(v ?? ''))"
          />
          <UButton color="error" variant="ghost" size="xs" icon="i-lucide-x" square @click="removeMonthlyDay(idx)" />
        </div>
      </div>
    </div>

    <!-- Yearly -->
    <div v-if="type === 'yearly'" class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Tanggal dalam tahun</p>
        <UButton color="neutral" variant="outline" size="xs" icon="i-lucide-plus" @click="addYearlyDate">
          Tambah
        </UButton>
      </div>
      <div v-if="yearlyDates.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
        Belum ada tanggal — tambahkan minimal satu.
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(d, idx) in yearlyDates"
          :key="idx"
          class="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-700"
        >
          <UInput
            :model-value="String(d.month)"
            type="number"
            min="1"
            max="12"
            class="w-16"
            size="sm"
            @update:model-value="v => setYearlyMonth(idx, String(v ?? ''))"
          />
          <span class="text-sm text-gray-400">/</span>
          <UInput
            :model-value="String(d.day)"
            type="number"
            min="1"
            max="31"
            class="w-16"
            size="sm"
            @update:model-value="v => setYearlyDay(idx, String(v ?? ''))"
          />
          <UButton color="error" variant="ghost" size="xs" icon="i-lucide-x" square @click="removeYearlyDate(idx)" />
        </div>
      </div>
    </div>
  </div>
</template>

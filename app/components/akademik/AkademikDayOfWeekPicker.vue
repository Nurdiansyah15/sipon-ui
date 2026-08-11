<script setup lang="ts">
import type { DayOfWeek } from '#shared/types/Akademik'

const props = defineProps<{
  modelValue: DayOfWeek[]
}>()

const emit = defineEmits<{
  'update:modelValue': [DayOfWeek[]]
}>()

const days: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Sen' },
  { value: 'tuesday', label: 'Sel' },
  { value: 'wednesday', label: 'Rab' },
  { value: 'thursday', label: 'Kam' },
  { value: 'friday', label: 'Jum' },
  { value: 'saturday', label: 'Sab' },
  { value: 'sunday', label: 'Min' },
]

function toggle(day: DayOfWeek) {
  const current = props.modelValue ?? []
  if (current.includes(day)) {
    emit('update:modelValue', current.filter((d) => d !== day))
  } else {
    emit('update:modelValue', [...current, day])
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="d in days"
      :key="d.value"
      type="button"
      class="rounded-lg border px-3 py-1.5 text-sm font-medium transition"
      :class="(props.modelValue ?? []).includes(d.value)
        ? 'border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500'
        : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'"
      @click="toggle(d.value)"
    >
      {{ d.label }}
    </button>
  </div>
</template>

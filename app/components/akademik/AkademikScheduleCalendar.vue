<script setup lang="ts">
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type { ActivityScheduleType, ScheduleCalendarItem, ScheduleCalendarResponse } from '#shared/types/Akademik'

const props = defineProps<{
  periodFilter: string
}>()

const emit = defineEmits<{
  (e: 'schedule-click', id: string): void
}>()

const api = useApi()
const loading = ref(true)
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const typeFilter = ref<ActivityScheduleType[]>(['once', 'daily', 'weekly', 'monthly', 'yearly'])

const itemsByDate = ref<Record<string, ScheduleCalendarItem[]>>({})

const typeMeta: Record<ActivityScheduleType, { label: string; dot: string }> = {
  once: { label: 'Sekali', dot: 'bg-gray-400' },
  daily: { label: 'Harian', dot: 'bg-teal-500' },
  weekly: { label: 'Mingguan', dot: 'bg-blue-500' },
  monthly: { label: 'Bulanan', dot: 'bg-purple-500' },
  yearly: { label: 'Tahunan', dot: 'bg-orange-500' },
}

async function fetchCalendar() {
  loading.value = true
  try {
    const from = new Date(currentYear.value, currentMonth.value, 1)
    const to = new Date(currentYear.value, currentMonth.value + 1, 0)
    const query: Record<string, string> = {
      from: toISO(from),
      to: toISO(to),
    }
    if (props.periodFilter !== 'all') {
      query.academic_period_id = props.periodFilter
    }
    query.types = typeFilter.value.join(',')
    const res = await api.get<ApiSuccess<ScheduleCalendarResponse>>('/api/v1/web/akademik/calendar', { query })
    const days = res.data?.days ?? []
    const map: Record<string, ScheduleCalendarItem[]> = {}
    for (const d of days) {
      map[d.date] = d.items
    }
    itemsByDate.value = map
  } catch {
    itemsByDate.value = {}
  } finally {
    loading.value = false
  }
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDateKey(date: Date): string {
  return toISO(date)
}

const monthLabel = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1)
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
})

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const days: (Date | null)[] = []

  for (let i = 0; i < startOffset; i++) {
    days.push(null)
  }

  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  for (let d = 1; d <= lastDay; d++) {
    days.push(new Date(currentYear.value, currentMonth.value, d))
  }

  while (days.length % 7 !== 0) {
    days.push(null)
  }

  return days
})

const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function today() {
  const now = new Date()
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth()
}

function isToday(date: Date): boolean {
  const now = new Date()
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
}

function itemsFor(date: Date): ScheduleCalendarItem[] {
  return (itemsByDate.value[getDateKey(date)] ?? []).filter(i => typeFilter.value.includes(i.type))
}

function toggleType(type: ActivityScheduleType) {
  const idx = typeFilter.value.indexOf(type)
  if (idx === -1) {
    typeFilter.value.push(type)
  } else {
    typeFilter.value.splice(idx, 1)
  }
}

function isTypeActive(type: ActivityScheduleType): boolean {
  return typeFilter.value.includes(type)
}

function fmtTime(v: string): string {
  return v.slice(0, 5)
}

function tooltipText(item: ScheduleCalendarItem): string {
  return `${fmtTime(item.start_time)}–${fmtTime(item.end_time)} · ${item.activity_name ?? 'Kegiatan'}`
}

const typeFilterKey = computed(() => typeFilter.value.join(','))

watch(() => [currentYear.value, currentMonth.value, props.periodFilter, typeFilterKey.value], () => fetchCalendar())

onMounted(() => {
  fetchCalendar()
})
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <button
        v-for="opt in (Object.keys(typeMeta) as ActivityScheduleType[])"
        :key="opt"
        type="button"
        class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition"
        :class="isTypeActive(opt)
          ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'"
        @click="toggleType(opt)"
      >
        <span class="h-2 w-2 rounded-full" :class="typeMeta[opt].dot" />
        {{ typeMeta[opt].label }}
      </button>
    </div>

    <div class="relative rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700/50">
        <UButton variant="ghost" size="xs" icon="i-lucide-chevron-left" @click="prevMonth" />
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ monthLabel }}</span>
          <UButton variant="ghost" size="xs" label="Hari ini" @click="today" />
        </div>
        <UButton variant="ghost" size="xs" icon="i-lucide-chevron-right" @click="nextMonth" />
      </div>

      <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700/50">
        <div
          v-for="day in weekDays"
          :key="day"
          class="border-r border-gray-200 px-2 py-2 text-center text-xs font-medium uppercase text-gray-500 last:border-r-0 dark:border-gray-700/50 dark:text-gray-400"
        >
          {{ day }}
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="h-6 w-6 animate-spin text-teal-600" />
      </div>

      <div v-else class="grid grid-cols-7">
        <div
          v-for="(date, idx) in calendarDays"
          :key="idx"
          class="min-h-[80px] border-b border-r border-gray-200 p-1.5 dark:border-gray-700/50"
          :class="{
            'bg-gray-50 dark:bg-gray-800/30': date === null,
          }"
        >
          <div v-if="date">
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-medium"
                :class="isToday(date)
                  ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white'
                  : 'text-gray-700 dark:text-gray-300'"
              >
                {{ date.getDate() }}
              </span>
            </div>

            <div class="mt-1.5 flex flex-wrap gap-1">
              <UTooltip
                v-for="item in itemsFor(date).slice(0, 5)"
                :key="item.id"
                :text="tooltipText(item)"
                :content="{ side: 'bottom' }"
              >
                <button
                  type="button"
                  class="h-2.5 w-2.5 rounded-full transition hover:scale-125"
                  :class="typeMeta[item.type].dot"
                  @click="emit('schedule-click', item.id)"
                />
              </UTooltip>
            </div>

            <div v-if="itemsFor(date).length > 5" class="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
              +{{ itemsFor(date).length - 5 }} lainnya
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-4">
      <div
        v-for="opt in (Object.keys(typeMeta) as ActivityScheduleType[])"
        :key="`lg-${opt}`"
        class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
      >
        <span class="h-2.5 w-2.5 rounded-full" :class="typeMeta[opt].dot" />
        {{ typeMeta[opt].label }}
      </div>
    </div>
  </div>
</template>

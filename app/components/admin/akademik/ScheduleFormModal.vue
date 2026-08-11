<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type {
  ActivitySchedule,
  ActivityScheduleType,
  DayOfWeek,
  YearlyDate,
} from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'

const props = defineProps<{
  open: boolean
  activityPeriodId: string
  schedule?: ActivitySchedule | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useAkademikStore()
const toast = useToast()

const isEdit = computed(() => !!props.schedule)
const isSubmitting = computed(() => store.isSubmitting)

const typeOptions = [
  { label: 'Sekali', value: 'once' },
  { label: 'Harian', value: 'daily' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Bulanan', value: 'monthly' },
  { label: 'Tahunan', value: 'yearly' },
]

const schema = z.object({
  type: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  start_time: z.string().min(1, 'Jam mulai wajib diisi'),
  end_time: z.string().min(1, 'Jam selesai wajib diisi'),
}).refine(data => !data.end_time || !data.start_time || data.end_time > data.start_time, {
  message: 'Jam selesai harus setelah jam mulai',
  path: ['end_time'],
})

const form = reactive({
  type: 'weekly' as ActivityScheduleType,
  start_date: '',
  end_date: '',
  start_time: '19:30',
  end_time: '21:00',
  weeklyDays: [] as DayOfWeek[],
  monthlyDays: [] as number[],
  yearlyDates: [] as YearlyDate[],
})

watch(() => props.open, (val) => {
  if (val) {
    if (props.schedule) {
      form.type = props.schedule.type
      form.start_date = props.schedule.start_date ?? ''
      form.end_date = props.schedule.end_date ?? ''
      form.start_time = props.schedule.start_time.slice(0, 5)
      form.end_time = props.schedule.end_time.slice(0, 5)
      form.weeklyDays = props.schedule.weekly_days ?? []
      form.monthlyDays = props.schedule.monthly_days ?? []
      form.yearlyDates = props.schedule.yearly_dates ?? []
    } else {
      form.type = 'weekly'
      form.start_date = ''
      form.end_date = ''
      form.start_time = '19:30'
      form.end_time = '21:00'
      form.weeklyDays = []
      form.monthlyDays = []
      form.yearlyDates = []
    }
  }
})

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  const payload = {
    start_date: form.start_date || undefined,
    end_date: form.end_date || undefined,
    start_time: `${form.start_time}:00`,
    end_time: `${form.end_time}:00`,
    weekly_days: form.type === 'weekly' ? form.weeklyDays : undefined,
    monthly_days: form.type === 'monthly' ? form.monthlyDays : undefined,
    yearly_dates: form.type === 'yearly' ? form.yearlyDates : undefined,
  }
  try {
    if (props.schedule) {
      await store.updateSchedule(props.schedule.id, payload)
      toast.add({ title: 'Jadwal diperbarui', color: 'success' })
    } else {
      await store.createSchedule({
        activity_period_id: props.activityPeriodId,
        type: form.type,
        ...payload,
      })
      toast.add({ title: 'Jadwal berhasil dibuat', color: 'success' })
    }
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menyimpan jadwal', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? 'Edit Jadwal' : 'Buat Jadwal' }}
          </h3>
          <UButton
            v-if="!isSubmitting"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="emit('update:open', false)"
          />
        </div>

        <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
          <UFormField label="Tipe" name="type" required>
            <USelect v-model="form.type" :items="typeOptions" class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Tanggal Mulai" name="start_date">
              <UInput v-model="form.start_date" type="date" variant="subtle" class="w-full" />
            </UFormField>
            <UFormField label="Tanggal Selesai" name="end_date">
              <UInput v-model="form.end_date" type="date" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Jam Mulai" name="start_time" required>
              <UInput v-model="form.start_time" type="time" variant="subtle" class="w-full" />
            </UFormField>
            <UFormField label="Jam Selesai" name="end_time" required>
              <UInput v-model="form.end_time" type="time" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <AkademikRecurrenceEditor
            :type="form.type"
            :weekly-days="form.weeklyDays"
            :monthly-days="form.monthlyDays"
            :yearly-dates="form.yearlyDates"
            @update:weekly-days="form.weeklyDays = $event"
            @update:monthly-days="form.monthlyDays = $event"
            @update:yearly-dates="form.yearlyDates = $event"
          />

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              {{ isEdit ? 'Simpan' : 'Buat Jadwal' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type { ActivitySchedule, ActivityPeriod } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'
import { useAkademikPeriodContext } from '~/composables/useAkademikPeriodContext'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useAkademikStore()
const { selectedPeriodId } = useAkademikPeriodContext()
const toast = useToast()

const isSubmitting = computed(() => store.isSubmitting)

const schema = z.object({
  activity_schedule_id: z.string().min(1, 'Jadwal wajib dipilih'),
  starts_at_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  starts_at_time: z.string().min(1, 'Jam mulai wajib diisi'),
  ends_at_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
  ends_at_time: z.string().min(1, 'Jam selesai wajib diisi'),
}).refine(data => !data.starts_at_date || !data.starts_at_time || !data.ends_at_date || !data.ends_at_time
  || `${data.ends_at_date}T${data.ends_at_time}` > `${data.starts_at_date}T${data.starts_at_time}`, {
  message: 'Waktu selesai harus setelah waktu mulai',
  path: ['ends_at_date'],
})

const form = reactive({
  activity_schedule_id: '',
  starts_at_date: '',
  starts_at_time: '',
  ends_at_date: '',
  ends_at_time: '',
})

const loadingSchedules = ref(false)
const schedules = ref<ActivitySchedule[]>([])

async function loadSchedules() {
  if (!selectedPeriodId.value) return
  loadingSchedules.value = true
  try {
    const api = useApi()
    const apRes = await api.get<ApiSuccess<ActivityPeriod[]>>('/api/v1/web/akademik/activity-periods', {
      query: { page: 1, limit: 100, academic_period_id: selectedPeriodId.value, status: 'active' },
    })
    const all: ActivitySchedule[] = []
    for (const ap of apRes.data) {
      const res = await api.get<ApiSuccess<ActivitySchedule[]>>(`/api/v1/web/akademik/activity-periods/${ap.id}/schedules`)
      all.push(...res.data)
    }
    schedules.value = all
  } catch {
    schedules.value = []
  } finally {
    loadingSchedules.value = false
  }
}

const scheduleOptions = computed(() =>
  schedules.value.map((s) => ({
    label: `${s.activity_name ?? s.activity_code ?? 'Jadwal'} — ${s.type} (${s.start_time?.slice(0, 5) ?? ''})`,
    value: s.id,
  })),
)

watch(() => props.open, (val) => {
  if (val) {
    form.activity_schedule_id = schedules.value[0]?.id ?? ''
    form.starts_at_date = ''
    form.starts_at_time = ''
    form.ends_at_date = ''
    form.ends_at_time = ''
    loadSchedules()
  }
})

// "2026-08-10" + "19:30" → RFC3339 "2026-08-10T19:30:00Z"
function toRFC3339(date: string, time: string) {
  if (!date || !time) return ''
  return `${date}T${time}:00Z`
}

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  try {
    await store.createSession({
      activity_schedule_id: form.activity_schedule_id,
      starts_at: toRFC3339(form.starts_at_date, form.starts_at_time),
      ends_at: toRFC3339(form.ends_at_date, form.ends_at_time),
    })
    toast.add({ title: 'Sesi berhasil dibuat', color: 'success' })
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal membuat sesi', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Buat Sesi</h3>
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
          <UFormField label="Jadwal" name="activity_schedule_id" required>
            <USelect
              v-model="form.activity_schedule_id"
              :items="scheduleOptions"
              :loading="loadingSchedules"
              placeholder="Pilih jadwal"
              searchable
              class="w-full"
            />
          </UFormField>

          <UFormField label="Waktu Mulai" name="starts_at_date" required>
            <div class="grid grid-cols-2 gap-2">
              <UInput v-model="form.starts_at_date" type="date" variant="subtle" placeholder="Tanggal" />
              <UInput v-model="form.starts_at_time" type="time" variant="subtle" placeholder="Jam" />
            </div>
          </UFormField>

          <UFormField label="Waktu Selesai" name="ends_at_date" required>
            <div class="grid grid-cols-2 gap-2">
              <UInput v-model="form.ends_at_date" type="date" variant="subtle" placeholder="Tanggal" />
              <UInput v-model="form.ends_at_time" type="time" variant="subtle" placeholder="Jam" />
            </div>
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              Buat Sesi
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

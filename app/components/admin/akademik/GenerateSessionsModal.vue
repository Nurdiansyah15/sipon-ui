<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ActivitySchedule } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'
import { scheduleDatesInRange, formatDate } from '~/utils/akademikSchedule'

const props = defineProps<{
  open: boolean
  schedule: ActivitySchedule
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: [created: number, skipped: number]
}>()

const store = useAkademikStore()
const toast = useToast()

const isSubmitting = computed(() => store.isSubmitting)

const schema = z.object({
  from_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  to_date: z.string().optional(),
}).refine(data => !data.from_date || !data.to_date || data.to_date >= data.from_date, {
  message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
  path: ['to_date'],
})

const form = reactive({
  from_date: '',
  to_date: '',
})

function todayYMD(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

watch(() => props.open, (val) => {
  if (val) {
    form.from_date = todayYMD()
    form.to_date = ''
  }
})

const previewDates = computed(() => {
  if (!form.from_date) return []
  return scheduleDatesInRange(props.schedule, form.from_date, form.to_date || form.from_date)
})

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  try {
    const res = await store.generateSessions(props.schedule.id, {
      from_date: form.from_date,
      to_date: form.to_date || undefined,
    })
    const description = res.total_skipped > 0
      ? `${res.total_skipped} tanggal dilewati karena sudah ada sesi`
      : undefined
    toast.add({
      title: `${res.total_created} sesi berhasil digenerate`,
      description,
      color: 'success',
    })
    emit('update:open', false)
    emit('success', res.total_created, res.total_skipped)
  } catch {
    toast.add({ title: store.error ?? 'Gagal mengenerate sesi', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Generate Sesi dari Jadwal</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ schedule.activity_name }} · {{ schedule.start_time?.slice(0, 5) }} – {{ schedule.end_time?.slice(0, 5) }}
            </p>
          </div>
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
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Dari Tanggal" name="from_date" required>
              <UInput v-model="form.from_date" type="date" variant="subtle" class="w-full" />
            </UFormField>
            <UFormField label="Sampai Tanggal" name="to_date" hint="Opsional, default = dari tanggal">
              <UInput v-model="form.to_date" type="date" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700/50 dark:bg-gray-900/50">
            <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview ({{ previewDates.length }} tanggal)
            </p>
            <div v-if="previewDates.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
              Tidak ada tanggal dalam rentang ini yang cocok dengan pola jadwal.
            </div>
            <div v-else class="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
              <UBadge
                v-for="d in previewDates"
                :key="d"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ formatDate(d) }}
              </UBadge>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary" icon="i-lucide-zap">
              Generate Sesi
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

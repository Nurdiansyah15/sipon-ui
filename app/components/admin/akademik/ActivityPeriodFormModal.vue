<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Activity, AcademicPeriod } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useAkademikStore()
const toast = useToast()

const isSubmitting = computed(() => store.isSubmitting)

const schema = z.object({
  activity_id: z.string().min(1, 'Kegiatan wajib dipilih'),
  academic_period_id: z.string().min(1, 'Periode wajib dipilih'),
})

const form = reactive({
  activity_id: '',
  academic_period_id: '',
})

const activityOptions = computed(() =>
  store.activities.map((a: Activity) => ({ label: `${a.code} — ${a.name}`, value: a.id })),
)

const periodOptions = computed(() =>
  store.periods.map((p: AcademicPeriod) => ({ label: `${p.code} — ${p.name}`, value: p.id })),
)

watch(() => props.open, async (val) => {
  if (val) {
    form.activity_id = ''
    form.academic_period_id = ''
    if (store.activities.length === 0) {
      try { await store.fetchActivities({ limit: 100 }) } catch { /* ignore */ }
    }
    if (store.periods.length === 0) {
      try { await store.fetchPeriods({ limit: 100 }) } catch { /* ignore */ }
    }
  }
})

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  try {
    await store.createActivityPeriod({
      activity_id: form.activity_id,
      academic_period_id: form.academic_period_id,
    })
    toast.add({ title: 'Aktivasi kegiatan berhasil dibuat', color: 'success' })
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal membuat aktivasi kegiatan', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Aktivasi Kegiatan</h3>
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
          <UFormField label="Kegiatan" name="activity_id" required>
            <USelect
              v-model="form.activity_id"
              :items="activityOptions"
              :loading="store.isLoading"
              placeholder="Pilih kegiatan"
              searchable
              class="w-full"
            />
          </UFormField>

          <UFormField label="Periode Akademik" name="academic_period_id" required>
            <USelect
              v-model="form.academic_period_id"
              :items="periodOptions"
              :loading="store.isLoading"
              placeholder="Pilih periode"
              searchable
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              Aktivasi
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

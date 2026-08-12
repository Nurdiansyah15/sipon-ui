<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AcademicPeriod } from '#shared/types/Akademik'
import type { SantriItem } from '#shared/types/Kesantrian'
import { useAkademikStore } from '~/stores/akademik'
import { useKesantrianStore } from '~/stores/kesantrian'
import { useAkademikPeriodContext } from '~/composables/useAkademikPeriodContext'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useAkademikStore()
const kesantrianStore = useKesantrianStore()
const { selectedPeriodId } = useAkademikPeriodContext()
const toast = useToast()

const isSubmitting = computed(() => store.isSubmitting)

const schema = z.object({
  santri_id: z.string().min(1, 'Santri wajib dipilih'),
  academic_period_id: z.string().min(1, 'Periode wajib dipilih'),
})

const form = reactive({
  santri_id: '',
  academic_period_id: '',
})

const santriList = computed<SantriItem[]>(() => kesantrianStore.santriList)
const periods = computed<AcademicPeriod[]>(() => store.workPeriods.filter(p => p.status === 'open'))

const santriOptions = computed(() =>
  santriList.value.map((s) => ({
    label: s.fullname ? `${s.fullname} (${s.nis ?? '-'})` : (s.nis ?? s.username),
    value: s.id,
  })),
)

const periodOptions = computed(() =>
  periods.value.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id })),
)

watch(() => props.open, async (val) => {
  if (val) {
    form.santri_id = ''
    form.academic_period_id = selectedPeriodId.value ?? ''
    if (santriList.value.length === 0) {
      try { await kesantrianStore.fetchSantriList({ limit: 100 }) } catch { /* ignore */ }
    }
    if (periods.value.length === 0) {
      try { await store.fetchWorkPeriods() } catch { /* ignore */ }
    }
  }
})

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  try {
    await store.createRegistration({
      santri_id: form.santri_id,
      academic_period_id: form.academic_period_id,
    })
    toast.add({ title: 'Registrasi berhasil dibuat', color: 'success' })
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal membuat registrasi', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Herregistrasi Santri</h3>
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
          <UFormField label="Santri" name="santri_id" required>
            <USelect
              v-model="form.santri_id"
              :items="santriOptions"
              :loading="kesantrianStore.isLoadingSantri"
              placeholder="Pilih santri"
              searchable
              class="w-full"
            />
          </UFormField>

          <UFormField label="Periode Akademik" name="academic_period_id" required>
            <USelect
              v-model="form.academic_period_id"
              :items="periodOptions"
              :loading="store.isLoading"
              placeholder="Pilih periode (status open)"
              searchable
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              Buat Registrasi
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

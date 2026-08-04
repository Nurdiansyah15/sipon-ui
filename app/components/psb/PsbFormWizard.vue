<script setup lang="ts">
import type { UpsertFormulirRequest } from '#shared/types/Psb'
import { usePsbStore } from '~/stores/psb'
import { parseApiError } from '~/utils/errorParser'

const emit = defineEmits<{
  saved: []
}>()

const store = usePsbStore()
const toast = useToast()

const currentStep = ref(0)
const isSaving = ref(false)
const isFetchingDocs = ref(false)

const steps = [
  { label: 'Data Pribadi', icon: 'i-lucide-user', value: 0 },
  { label: 'Alamat & Sekolah', icon: 'i-lucide-map-pin', value: 1 },
  { label: 'Kependudukan', icon: 'i-lucide-id-card', value: 2 },
  { label: 'Orang Tua / Wali', icon: 'i-lucide-users', value: 3 },
  { label: 'Info Tambahan', icon: 'i-lucide-briefcase', value: 4 },
  { label: 'Dokumen', icon: 'i-lucide-file-text', value: 5 },
  { label: 'Review', icon: 'i-lucide-clipboard-check', value: 6 },
]

const formState = reactive<UpsertFormulirRequest>({
  nickname: null, program: null, hobby: null, purpose: null, motivation_entry: null,
  pob: null, dob: null, blood: null,
  address: null, sub_district: null, district: null, province: null, postal_code: null,
  previous_pondok_name: null, previous_pondok_address: null, previous_pondok_div: null, previous_pondok_time: null,
  nik: null, no_kk: null, nisn: null, no_kip: null, no_kks: null, no_pkh: null,
  workplace: null, department: null, home_status: null,
  father: null, father_pn: null, father_nik: null, father_job: null, father_graduate: null, father_income: null,
  mother: null, mother_pn: null, mother_nik: null, mother_job: null, mother_graduate: null, mother_income: null,
  guardian_relationship: null, guardian: null, guardian_pn: null, guardian_nik: null, guardian_job: null, guardian_graduate: null, guardian_income: null,
})

function loadFormFromStore() {
  if (store.pendaftar) {
    maxStepReached.value = steps.length - 1
    const s = store.pendaftar
    Object.assign(formState, {
      nickname: s.nickname, program: s.program, hobby: s.hobby, purpose: s.purpose,
      motivation_entry: s.motivation_entry, pob: s.pob,
      dob: s.dob ? s.dob.split('T')[0] : null,
      blood: s.blood,
      address: s.address, sub_district: s.sub_district, district: s.district,
      province: s.province, postal_code: s.postal_code,
      previous_pondok_name: s.previous_pondok_name, previous_pondok_address: s.previous_pondok_address,
      previous_pondok_div: s.previous_pondok_div, previous_pondok_time: s.previous_pondok_time,
      nik: s.nik, no_kk: s.no_kk, nisn: s.nisn, no_kip: s.no_kip, no_kks: s.no_kks, no_pkh: s.no_pkh,
      workplace: s.workplace, department: s.department, home_status: s.home_status,
      father: s.father, father_pn: s.father_pn, father_nik: s.father_nik,
      father_job: s.father_job, father_graduate: s.father_graduate, father_income: s.father_income,
      mother: s.mother, mother_pn: s.mother_pn, mother_nik: s.mother_nik,
      mother_job: s.mother_job, mother_graduate: s.mother_graduate, mother_income: s.mother_income,
      guardian_relationship: s.guardian_relationship, guardian: s.guardian,
      guardian_pn: s.guardian_pn, guardian_nik: s.guardian_nik,
      guardian_job: s.guardian_job, guardian_graduate: s.guardian_graduate, guardian_income: s.guardian_income,
    })
  }
}

onMounted(() => {
  loadFormFromStore()
})

async function handleSave() {
  isSaving.value = true
  try {
    const payload: UpsertFormulirRequest = { ...formState }
    if (store.pendingDokumenList.length > 0) {
      payload.dokumen = store.pendingDokumenList
    }
    await store.upsertFormulir(payload)
    store.clearPendingDokumen()
    await store.fetchDokumen()
    emit('saved')
  } catch (err) {
    toast.add({ title: 'Gagal menyimpan', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isSaving.value = false
  }
}

const maxStepReached = ref(0)

async function next() {
  if (currentStep.value < steps.length - 1) {
    const nextStep = currentStep.value + 1
    if (nextStep === 5) {
      isFetchingDocs.value = true
      try {
        await store.fetchDokumen()
      } catch { /* non-blocking */ }
      isFetchingDocs.value = false
    }
    currentStep.value = nextStep
    maxStepReached.value = Math.max(maxStepReached.value, nextStep)
  }
}

function prev() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function goToStep(index: number) {
  if (index <= maxStepReached.value) {
    currentStep.value = index
    if (index === 5) {
      isFetchingDocs.value = true
      store.fetchDokumen().finally(() => {
        isFetchingDocs.value = false
      })
    }
  }
}
</script>

<template>
  <div class="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
    <!-- Desktop sidebar stepper -->
    <aside class="hidden lg:block">
      <nav class="sticky top-24 space-y-1 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700/50 dark:bg-gray-900">
        <button
          v-for="(step, i) in steps"
          :key="step.value"
          type="button"
          class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors"
          :class="[
            i === currentStep
              ? 'bg-teal-50 font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-400'
              : i <= maxStepReached
                ? 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                : 'cursor-not-allowed text-gray-400 dark:text-gray-600',
          ]"
          :disabled="i > maxStepReached"
          @click="goToStep(i)"
        >
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            :class="[
              i < currentStep
                ? 'bg-teal-600 text-white'
                : i === currentStep
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800',
            ]"
          >
            <UIcon v-if="i < currentStep" name="i-lucide-check" class="h-4 w-4" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          {{ step.label }}
        </button>
      </nav>
    </aside>

    <div class="min-w-0">
      <!-- Mobile / tablet stepper -->
      <UStepper v-model="currentStep" :items="steps" orientation="horizontal" class="mb-8 lg:hidden" />

      <div class="min-h-[400px]">
        <PsbStepDataPribadi v-if="currentStep === 0" v-model="formState" @next="next" />
        <PsbStepAlamatSekolah v-if="currentStep === 1" v-model="formState" @next="next" @prev="prev" />
        <PsbStepDataKependudukan v-if="currentStep === 2" v-model="formState" @next="next" @prev="prev" />
        <PsbStepOrangTuaWali v-if="currentStep === 3" v-model="formState" @next="next" @prev="prev" />
        <PsbStepInformasiTambahan v-if="currentStep === 4" v-model="formState" @next="next" @prev="prev" />
        <PsbStepDokumen v-if="currentStep === 5" :loading="isFetchingDocs" @next="next" @prev="prev" />
        <PsbStepReview v-if="currentStep === 6" :form="formState" :saving="isSaving" @save="handleSave" @prev="prev" />
      </div>
    </div>
  </div>
</template>

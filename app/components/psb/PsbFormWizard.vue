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

const steps = [
  { label: 'Data Pribadi', icon: 'i-lucide-user' },
  { label: 'Alamat & Sekolah', icon: 'i-lucide-map-pin' },
  { label: 'Kependudukan', icon: 'i-lucide-id-card' },
  { label: 'Orang Tua / Wali', icon: 'i-lucide-users' },
  { label: 'Dokumen', icon: 'i-lucide-file-text' },
  { label: 'Review', icon: 'i-lucide-clipboard-check' },
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

onMounted(() => {
  if (store.pendaftar) {
    Object.assign(formState, {
      nickname: store.pendaftar.nickname,
      program: store.pendaftar.program,
      hobby: store.pendaftar.hobby,
      purpose: store.pendaftar.purpose,
      motivation_entry: store.pendaftar.motivation_entry,
      pob: store.pendaftar.pob,
      dob: store.pendaftar.dob,
      blood: store.pendaftar.blood,
      address: store.pendaftar.address,
      sub_district: store.pendaftar.sub_district,
      district: store.pendaftar.district,
      province: store.pendaftar.province,
      postal_code: store.pendaftar.postal_code,
      previous_pondok_name: store.pendaftar.previous_pondok_name,
      previous_pondok_address: store.pendaftar.previous_pondok_address,
      previous_pondok_div: store.pendaftar.previous_pondok_div,
      previous_pondok_time: store.pendaftar.previous_pondok_time,
      nik: store.pendaftar.nik,
      no_kk: store.pendaftar.no_kk,
      nisn: store.pendaftar.nisn,
      no_kip: store.pendaftar.no_kip,
      no_kks: store.pendaftar.no_kks,
      no_pkh: store.pendaftar.no_pkh,
      workplace: store.pendaftar.workplace,
      department: store.pendaftar.department,
      home_status: store.pendaftar.home_status,
      father: store.pendaftar.father,
      father_pn: store.pendaftar.father_pn,
      father_nik: store.pendaftar.father_nik,
      father_job: store.pendaftar.father_job,
      father_graduate: store.pendaftar.father_graduate,
      father_income: store.pendaftar.father_income,
      mother: store.pendaftar.mother,
      mother_pn: store.pendaftar.mother_pn,
      mother_nik: store.pendaftar.mother_nik,
      mother_job: store.pendaftar.mother_job,
      mother_graduate: store.pendaftar.mother_graduate,
      mother_income: store.pendaftar.mother_income,
      guardian_relationship: store.pendaftar.guardian_relationship,
      guardian: store.pendaftar.guardian,
      guardian_pn: store.pendaftar.guardian_pn,
      guardian_nik: store.pendaftar.guardian_nik,
      guardian_job: store.pendaftar.guardian_job,
      guardian_graduate: store.pendaftar.guardian_graduate,
      guardian_income: store.pendaftar.guardian_income,
    })
  }
})

async function handleSave() {
  isSaving.value = true
  try {
    await store.upsertFormulir({ ...formState })
    emit('saved')
  } catch (err) {
    toast.add({ title: 'Gagal menyimpan', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isSaving.value = false
  }
}

function next() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

function prev() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <UStepper v-model="currentStep" :items="steps" orientation="horizontal" class="mb-8" />

    <div class="min-h-[400px]">
      <PsbStepDataPribadi v-if="currentStep === 0" v-model="formState" @next="next" />
      <PsbStepAlamatSekolah v-if="currentStep === 1" v-model="formState" @next="next" @prev="prev" />
      <PsbStepDataKependudukan v-if="currentStep === 2" v-model="formState" @next="next" @prev="prev" />
      <PsbStepOrangTuaWali v-if="currentStep === 3" v-model="formState" @next="next" @prev="prev" />
      <PsbStepDokumen v-if="currentStep === 4" @next="next" @prev="prev" />
      <PsbStepReview v-if="currentStep === 5" :form="formState" :saving="isSaving" @save="handleSave" @prev="prev" />
    </div>
  </div>
</template>

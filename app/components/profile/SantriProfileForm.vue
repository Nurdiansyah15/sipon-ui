<script setup lang="ts">
import { useKesantrianStore } from '~/stores/kesantrian'
import type { UpdateSantriProfileRequest } from '#shared/types/Kesantrian'

const store = useKesantrianStore()
const toast = useToast()

const isSubmitting = ref(false)

// dob dari BE berupa RFC3339 ("2006-01-02T00:00:00Z") — <input type="date">
// cuma butuh bagian tanggalnya, lalu di-submit balik sebagai RFC3339 tengah
// malam UTC supaya lolos parsing time.Time di Go.
function toDateInputValue(iso?: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}
function fromDateInputValue(v: string): string | undefined {
  if (!v) return undefined
  return `${v}T00:00:00Z`
}

const form = reactive<Record<string, string>>({
  fullname: '',
  nickname: '',
  program: '',
  hobby: '',
  purpose: '',
  motivation_entry: '',
  pob: '',
  dob: '',
  blood: '',

  address: '',
  sub_district: '',
  district: '',
  province: '',
  postal_code: '',

  previous_pondok_name: '',
  previous_pondok_address: '',
  previous_pondok_div: '',
  previous_pondok_time: '',

  nik: '',
  no_kk: '',
  nisn: '',
  no_kip: '',
  no_kks: '',
  no_pkh: '',

  workplace: '',
  department: '',

  home_status: '',

  father: '',
  father_pn: '',
  father_nik: '',
  father_job: '',
  father_graduate: '',
  father_income: '',

  mother: '',
  mother_pn: '',
  mother_nik: '',
  mother_job: '',
  mother_graduate: '',
  mother_income: '',

  guardian_relationship: '',
  guardian: '',
  guardian_pn: '',
  guardian_nik: '',
  guardian_job: '',
  guardian_graduate: '',
  guardian_income: '',
})

function populateFromProfile() {
  const p = store.myProfile
  if (!p) return
  form.fullname = p.fullname ?? ''
  form.nickname = p.nickname ?? ''
  form.program = p.program ?? ''
  form.hobby = p.hobby ?? ''
  form.purpose = p.purpose ?? ''
  form.motivation_entry = p.motivation_entry ?? ''
  form.pob = p.pob ?? ''
  form.dob = toDateInputValue(p.dob)
  form.blood = p.blood ?? ''

  form.address = p.address ?? ''
  form.sub_district = p.sub_district ?? ''
  form.district = p.district ?? ''
  form.province = p.province ?? ''
  form.postal_code = p.postal_code ?? ''

  form.previous_pondok_name = p.previous_pondok_name ?? ''
  form.previous_pondok_address = p.previous_pondok_address ?? ''
  form.previous_pondok_div = p.previous_pondok_div ?? ''
  form.previous_pondok_time = p.previous_pondok_time ?? ''

  form.nik = p.nik ?? ''
  form.no_kk = p.no_kk ?? ''
  form.nisn = p.nisn ?? ''
  form.no_kip = p.no_kip ?? ''
  form.no_kks = p.no_kks ?? ''
  form.no_pkh = p.no_pkh ?? ''

  form.workplace = p.workplace ?? ''
  form.department = p.department ?? ''

  form.home_status = p.home_status ?? ''

  form.father = p.father ?? ''
  form.father_pn = p.father_pn ?? ''
  form.father_nik = p.father_nik ?? ''
  form.father_job = p.father_job ?? ''
  form.father_graduate = p.father_graduate ?? ''
  form.father_income = p.father_income ?? ''

  form.mother = p.mother ?? ''
  form.mother_pn = p.mother_pn ?? ''
  form.mother_nik = p.mother_nik ?? ''
  form.mother_job = p.mother_job ?? ''
  form.mother_graduate = p.mother_graduate ?? ''
  form.mother_income = p.mother_income ?? ''

  form.guardian_relationship = p.guardian_relationship ?? ''
  form.guardian = p.guardian ?? ''
  form.guardian_pn = p.guardian_pn ?? ''
  form.guardian_nik = p.guardian_nik ?? ''
  form.guardian_job = p.guardian_job ?? ''
  form.guardian_graduate = p.guardian_graduate ?? ''
  form.guardian_income = p.guardian_income ?? ''
}

watch(() => store.myProfile, populateFromProfile, { immediate: true })

async function onSubmit() {
  isSubmitting.value = true
  try {
    const payload: UpdateSantriProfileRequest = {
      fullname: form.fullname || undefined,
      nickname: form.nickname || undefined,
      program: form.program || undefined,
      hobby: form.hobby || undefined,
      purpose: form.purpose || undefined,
      motivation_entry: form.motivation_entry || undefined,
      pob: form.pob || undefined,
      dob: fromDateInputValue(form.dob),
      blood: form.blood || undefined,

      address: form.address || undefined,
      sub_district: form.sub_district || undefined,
      district: form.district || undefined,
      province: form.province || undefined,
      postal_code: form.postal_code || undefined,

      previous_pondok_name: form.previous_pondok_name || undefined,
      previous_pondok_address: form.previous_pondok_address || undefined,
      previous_pondok_div: form.previous_pondok_div || undefined,
      previous_pondok_time: form.previous_pondok_time || undefined,

      nik: form.nik || undefined,
      no_kk: form.no_kk || undefined,
      nisn: form.nisn || undefined,
      no_kip: form.no_kip || undefined,
      no_kks: form.no_kks || undefined,
      no_pkh: form.no_pkh || undefined,

      workplace: form.workplace || undefined,
      department: form.department || undefined,

      home_status: form.home_status || undefined,

      father: form.father || undefined,
      father_pn: form.father_pn || undefined,
      father_nik: form.father_nik || undefined,
      father_job: form.father_job || undefined,
      father_graduate: form.father_graduate || undefined,
      father_income: form.father_income || undefined,

      mother: form.mother || undefined,
      mother_pn: form.mother_pn || undefined,
      mother_nik: form.mother_nik || undefined,
      mother_job: form.mother_job || undefined,
      mother_graduate: form.mother_graduate || undefined,
      mother_income: form.mother_income || undefined,

      guardian_relationship: form.guardian_relationship || undefined,
      guardian: form.guardian || undefined,
      guardian_pn: form.guardian_pn || undefined,
      guardian_nik: form.guardian_nik || undefined,
      guardian_job: form.guardian_job || undefined,
      guardian_graduate: form.guardian_graduate || undefined,
      guardian_income: form.guardian_income || undefined,
    }

    await store.updateMyProfile(payload)
    toast.add({ title: 'Profil santri berhasil diperbarui', color: 'success' })
  } catch (err) {
    toast.add({
      title: 'Gagal memperbarui profil',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="space-y-8" @submit.prevent="onSubmit">
    <!-- Ringkasan identitas (read-only, dikelola dari akun) -->
    <div class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700/50 dark:bg-gray-800">
      <UBadge color="neutral" variant="subtle">NIS: {{ store.myProfile?.nis || '-' }}</UBadge>
      <UBadge color="neutral" variant="subtle">Username: {{ store.myProfile?.username }}</UBadge>
      <UBadge color="neutral" variant="subtle">Email: {{ store.myProfile?.email }}</UBadge>
    </div>

    <!-- Data Pribadi -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Data Pribadi</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Nama Lengkap" name="fullname">
          <UInput v-model="form.fullname" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Nama Panggilan" name="nickname">
          <UInput v-model="form.nickname" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Program" name="program">
          <UInput v-model="form.program" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Golongan Darah" name="blood">
          <UInput v-model="form.blood" class="w-full" variant="subtle" placeholder="A/B/AB/O" />
        </UFormField>
        <UFormField label="Tempat Lahir" name="pob">
          <UInput v-model="form.pob" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Tanggal Lahir" name="dob">
          <UInput v-model="form.dob" type="date" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Hobi" name="hobby">
          <UInput v-model="form.hobby" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Tujuan/Cita-cita" name="purpose">
          <UInput v-model="form.purpose" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Motivasi Masuk" name="motivation_entry" class="sm:col-span-2">
          <UTextarea v-model="form.motivation_entry" class="w-full" variant="subtle" :rows="2" />
        </UFormField>
      </div>
    </section>

    <!-- Kontak & Alamat -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Kontak &amp; Alamat</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Alamat" name="address" class="sm:col-span-2">
          <UTextarea v-model="form.address" class="w-full" variant="subtle" :rows="2" />
        </UFormField>
        <UFormField label="Kecamatan" name="sub_district">
          <UInput v-model="form.sub_district" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Kabupaten/Kota" name="district">
          <UInput v-model="form.district" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Provinsi" name="province">
          <UInput v-model="form.province" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Kode Pos" name="postal_code">
          <UInput v-model="form.postal_code" class="w-full" variant="subtle" />
        </UFormField>
      </div>
    </section>

    <!-- Pondok Sebelumnya -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pondok Sebelumnya</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Nama Pondok" name="previous_pondok_name">
          <UInput v-model="form.previous_pondok_name" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Alamat Pondok" name="previous_pondok_address">
          <UInput v-model="form.previous_pondok_address" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Jenjang/Divisi" name="previous_pondok_div">
          <UInput v-model="form.previous_pondok_div" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Lama Belajar" name="previous_pondok_time">
          <UInput v-model="form.previous_pondok_time" class="w-full" variant="subtle" />
        </UFormField>
      </div>
    </section>

    <!-- Kependudukan -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Kependudukan</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="NIK" name="nik">
          <UInput v-model="form.nik" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="No. Kartu Keluarga" name="no_kk">
          <UInput v-model="form.no_kk" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="NISN" name="nisn">
          <UInput v-model="form.nisn" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="No. KIP" name="no_kip">
          <UInput v-model="form.no_kip" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="No. KKS" name="no_kks">
          <UInput v-model="form.no_kks" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="No. PKH" name="no_pkh">
          <UInput v-model="form.no_pkh" class="w-full" variant="subtle" />
        </UFormField>
      </div>
    </section>

    <!-- Pekerjaan / Pendidikan -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pekerjaan &amp; Status Rumah</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Tempat Bekerja" name="workplace">
          <UInput v-model="form.workplace" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Departemen/Bagian" name="department">
          <UInput v-model="form.department" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Status Rumah" name="home_status">
          <UInput v-model="form.home_status" class="w-full" variant="subtle" placeholder="Milik sendiri / Sewa / dll" />
        </UFormField>
      </div>
    </section>

    <!-- Data Ayah -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Data Ayah</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Nama Ayah" name="father">
          <UInput v-model="form.father" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="No. Telepon Ayah" name="father_pn">
          <UInput v-model="form.father_pn" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="NIK Ayah" name="father_nik">
          <UInput v-model="form.father_nik" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Pekerjaan Ayah" name="father_job">
          <UInput v-model="form.father_job" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Pendidikan Terakhir Ayah" name="father_graduate">
          <UInput v-model="form.father_graduate" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Penghasilan Ayah" name="father_income">
          <UInput v-model="form.father_income" class="w-full" variant="subtle" />
        </UFormField>
      </div>
    </section>

    <!-- Data Ibu -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Data Ibu</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Nama Ibu" name="mother">
          <UInput v-model="form.mother" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="No. Telepon Ibu" name="mother_pn">
          <UInput v-model="form.mother_pn" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="NIK Ibu" name="mother_nik">
          <UInput v-model="form.mother_nik" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Pekerjaan Ibu" name="mother_job">
          <UInput v-model="form.mother_job" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Pendidikan Terakhir Ibu" name="mother_graduate">
          <UInput v-model="form.mother_graduate" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Penghasilan Ibu" name="mother_income">
          <UInput v-model="form.mother_income" class="w-full" variant="subtle" />
        </UFormField>
      </div>
    </section>

    <!-- Data Wali -->
    <section>
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Data Wali (jika ada)</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Hubungan Wali" name="guardian_relationship">
          <UInput v-model="form.guardian_relationship" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Nama Wali" name="guardian">
          <UInput v-model="form.guardian" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="No. Telepon Wali" name="guardian_pn">
          <UInput v-model="form.guardian_pn" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="NIK Wali" name="guardian_nik">
          <UInput v-model="form.guardian_nik" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Pekerjaan Wali" name="guardian_job">
          <UInput v-model="form.guardian_job" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Pendidikan Terakhir Wali" name="guardian_graduate">
          <UInput v-model="form.guardian_graduate" class="w-full" variant="subtle" />
        </UFormField>
        <UFormField label="Penghasilan Wali" name="guardian_income">
          <UInput v-model="form.guardian_income" class="w-full" variant="subtle" />
        </UFormField>
      </div>
    </section>

    <div class="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
      <UButton type="submit" icon="i-lucide-save" :loading="isSubmitting">Simpan Profil</UButton>
    </div>
  </form>
</template>

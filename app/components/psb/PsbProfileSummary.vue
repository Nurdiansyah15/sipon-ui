<script setup lang="ts">
import type { PendaftarProfileFields } from '#shared/types/Psb'

defineProps<{
  profile: PendaftarProfileFields
  gender?: string
}>()

function fmt(val: string | null): string {
  return val || '—'
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div>
      <h4 class="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">Data Pribadi</h4>
      <dl class="space-y-1 text-sm">
        <div><span class="text-gray-400">Nama Panggilan:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.nickname) }}</span></div>
        <div><span class="text-gray-400">Program:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.program) }}</span></div>
        <div v-if="gender"><span class="text-gray-400">Gender:</span> <span class="text-gray-900 dark:text-gray-100">{{ gender === '1' ? 'Laki-laki' : 'Perempuan' }}</span></div>
        <div><span class="text-gray-400">Hobi:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.hobby) }}</span></div>
        <div><span class="text-gray-400">Cita-cita:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.purpose) }}</span></div>
        <div><span class="text-gray-400">Motivasi:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.motivation_entry) }}</span></div>
        <div><span class="text-gray-400">Tempat Lahir:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.pob) }}</span></div>
        <div><span class="text-gray-400">Tanggal Lahir:</span> <span class="text-gray-900 dark:text-gray-100">{{ profile.dob ? new Date(profile.dob).toLocaleDateString('id-ID') : '—' }}</span></div>
        <div><span class="text-gray-400">Golongan Darah:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.blood) }}</span></div>
      </dl>
    </div>

    <div>
      <h4 class="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">Alamat & Sekolah</h4>
      <dl class="space-y-1 text-sm">
        <div><span class="text-gray-400">Alamat:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.address) }}</span></div>
        <div><span class="text-gray-400">Kelurahan:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.sub_district) }}</span></div>
        <div><span class="text-gray-400">Kecamatan:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.district) }}</span></div>
        <div><span class="text-gray-400">Provinsi:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.province) }}</span></div>
        <div><span class="text-gray-400">Kode Pos:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.postal_code) }}</span></div>
        <div v-if="profile.previous_pondok_name"><span class="text-gray-400">Pondok Sebelumnya:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.previous_pondok_name) }}</span></div>
      </dl>
    </div>

    <div>
      <h4 class="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">Data Kependudukan</h4>
      <dl class="space-y-1 text-sm">
        <div><span class="text-gray-400">NIK:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.nik) }}</span></div>
        <div><span class="text-gray-400">No. KK:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.no_kk) }}</span></div>
        <div><span class="text-gray-400">NISN:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.nisn) }}</span></div>
        <div v-if="profile.no_kip"><span class="text-gray-400">No. KIP:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.no_kip) }}</span></div>
        <div v-if="profile.no_kks"><span class="text-gray-400">No. KKS:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.no_kks) }}</span></div>
        <div v-if="profile.no_pkh"><span class="text-gray-400">No. PKH:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.no_pkh) }}</span></div>
      </dl>
    </div>

    <div>
      <h4 class="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">Orang Tua / Wali</h4>
      <dl class="space-y-1 text-sm">
        <div><span class="text-gray-400">Ayah:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.father) }}</span></div>
        <div><span class="text-gray-400">Ibu:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.mother) }}</span></div>
        <div v-if="profile.guardian"><span class="text-gray-400">Wali:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.guardian) }}</span></div>
        <div><span class="text-gray-400">Pekerjaan:</span> <span class="text-gray-900 dark:text-gray-100">{{ fmt(profile.workplace) }} — {{ fmt(profile.department) }}</span></div>
      </dl>
    </div>
  </div>
</template>

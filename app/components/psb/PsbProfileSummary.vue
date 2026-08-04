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
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
    <div>
      <h4 class="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">Data Pribadi</h4>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Nama Panggilan</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.nickname) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Program</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.program) }}</td>
          </tr>
          <tr v-if="gender">
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Gender</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ gender === '1' ? 'Laki-laki' : 'Perempuan' }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Hobi</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.hobby) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Cita-cita</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.purpose) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Motivasi</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.motivation_entry) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Tempat Lahir</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.pob) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Tanggal Lahir</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ profile.dob ? new Date(profile.dob).toLocaleDateString('id-ID') : '—' }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Golongan Darah</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.blood) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h4 class="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">Alamat & Sekolah</h4>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Alamat</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.address) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Kelurahan</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.sub_district) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Kecamatan</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.district) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Provinsi</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.province) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Kode Pos</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.postal_code) }}</td>
          </tr>
          <tr v-if="profile.previous_pondok_name">
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Pondok Sebelumnya</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.previous_pondok_name) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h4 class="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">Data Kependudukan</h4>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">NIK</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.nik) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">No. KK</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.no_kk) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">NISN</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.nisn) }}</td>
          </tr>
          <tr v-if="profile.no_kip">
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">No. KIP</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.no_kip) }}</td>
          </tr>
          <tr v-if="profile.no_kks">
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">No. KKS</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.no_kks) }}</td>
          </tr>
          <tr v-if="profile.no_pkh">
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">No. PKH</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.no_pkh) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h4 class="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">Orang Tua / Wali</h4>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Ayah</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.father) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Ibu</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.mother) }}</td>
          </tr>
          <tr v-if="profile.guardian">
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Wali</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.guardian) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h4 class="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300">Informasi Tambahan</h4>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Pekerjaan / Instansi</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.workplace) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Jurusan / Bagian</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.department) }}</td>
          </tr>
          <tr>
            <td class="py-1 pr-3 text-gray-400 whitespace-nowrap align-top">Status Tempat Tinggal</td>
            <td class="py-1 text-gray-900 dark:text-gray-100">{{ fmt(profile.home_status) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

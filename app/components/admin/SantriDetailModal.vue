<script setup lang="ts">
import { useKesantrianStore } from '~/stores/kesantrian'
import type { SantriProfile } from '#shared/types/Kesantrian'

const props = defineProps<{
  open: boolean
  santriId: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

const store = useKesantrianStore()

watch(
  () => props.open,
  (open) => {
    if (open && props.santriId) load()
  },
)

async function load() {
  try {
    await store.fetchSantriDetail(props.santriId)
  } catch (err) {
    // error sudah di-set ke store
  }
}

function close() {
  emit('update:open', false)
}

const detail = computed(() => store.santriDetail)

function genderLabel(option?: string | null) {
  if (option === '1') return 'Laki-laki'
  if (option === '2') return 'Perempuan'
  return '-'
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

interface Field {
  label: string
  value?: string | null
}

function fields(items: Field[]) {
  return items
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="flex h-[min(85vh,800px)] flex-col">
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700/50">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Detail Santri</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <div v-if="store.isLoadingSantriDetail" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
        </div>

        <UAlert
          v-else-if="!detail"
          icon="i-lucide-triangle-alert"
          color="error"
          variant="subtle"
          title="Gagal memuat detail santri"
          :description="store.error ?? 'Terjadi kesalahan, silakan coba lagi.'"
          class="m-6"
        />

        <div v-else class="flex-1 overflow-y-auto px-6 py-5">
          <!-- Ringkasan -->
          <div class="mb-6 flex items-center gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
            >
              <UIcon name="i-lucide-graduation-cap" class="h-7 w-7" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                {{ detail.fullname || detail.username || '-' }}
              </p>
              <p class="truncate text-sm text-gray-600 dark:text-gray-400">
                @{{ detail.username }} · {{ detail.email }}
              </p>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <UBadge color="neutral" variant="subtle" size="sm">
                  NIS {{ detail.nis || '-' }}
                </UBadge>
                <UBadge color="success" variant="subtle" size="sm">
                  {{ detail.status === 'SANTRI' ? 'Santri' : detail.status || '-' }}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Data Pribadi -->
          <SantriDetailSection title="Data Pribadi">
            <SantriDetailGrid
              :fields="
                fields([
                  { label: 'Jenis Kelamin', value: genderLabel(detail.option) },
                  { label: 'Nama Panggilan', value: detail.nickname },
                  { label: 'Program', value: detail.program },
                  { label: 'Hobi', value: detail.hobby },
                  { label: 'Tujuan', value: detail.purpose },
                  { label: 'Motivasi Masuk', value: detail.motivation_entry },
                  { label: 'Tempat Lahir', value: detail.pob },
                  { label: 'Tanggal Lahir', value: formatDate(detail.dob) },
                  { label: 'Golongan Darah', value: detail.blood },
                  { label: 'Status Rumah', value: detail.home_status },
                ])
              "
            />
          </SantriDetailSection>

          <!-- Alamat -->
          <SantriDetailSection title="Alamat">
            <SantriDetailGrid
              :fields="
                fields([
                  { label: 'Alamat', value: detail.address },
                  { label: 'Kecamatan', value: detail.sub_district },
                  { label: 'Kabupaten/Kota', value: detail.district },
                  { label: 'Provinsi', value: detail.province },
                  { label: 'Kode Pos', value: detail.postal_code },
                ])
              "
            />
          </SantriDetailSection>

          <!-- Identitas -->
          <SantriDetailSection title="Nomor Identitas">
            <SantriDetailGrid
              :fields="
                fields([
                  { label: 'NIK', value: detail.nik },
                  { label: 'No. Kartu Keluarga', value: detail.no_kk },
                  { label: 'NISN', value: detail.nisn },
                  { label: 'No. KIP', value: detail.no_kip },
                  { label: 'No. KKS', value: detail.no_kks },
                  { label: 'No. PKH', value: detail.no_pkh },
                ])
              "
            />
          </SantriDetailSection>

          <!-- Pondok Sebelumnya -->
          <SantriDetailSection title="Pondok Sebelumnya">
            <SantriDetailGrid
              :fields="
                fields([
                  { label: 'Nama Pondok', value: detail.previous_pondok_name },
                  { label: 'Alamat Pondok', value: detail.previous_pondok_address },
                  { label: 'Divisi', value: detail.previous_pondok_div },
                  { label: 'Lama (Tahun)', value: detail.previous_pondok_time },
                ])
              "
            />
          </SantriDetailSection>

          <!-- Pekerjaan -->
          <SantriDetailSection title="Pekerjaan / Departemen">
            <SantriDetailGrid
              :fields="
                fields([
                  { label: 'Tempat Kerja', value: detail.workplace },
                  { label: 'Departemen', value: detail.department },
                ])
              "
            />
          </SantriDetailSection>

          <!-- Ayah -->
          <SantriDetailSection title="Ayah">
            <SantriDetailGrid
              :fields="
                fields([
                  { label: 'Nama', value: detail.father },
                  { label: 'No. HP', value: detail.father_pn },
                  { label: 'NIK', value: detail.father_nik },
                  { label: 'Pekerjaan', value: detail.father_job },
                  { label: 'Pendidikan Terakhir', value: detail.father_graduate },
                  { label: 'Penghasilan', value: detail.father_income },
                ])
              "
            />
          </SantriDetailSection>

          <!-- Ibu -->
          <SantriDetailSection title="Ibu">
            <SantriDetailGrid
              :fields="
                fields([
                  { label: 'Nama', value: detail.mother },
                  { label: 'No. HP', value: detail.mother_pn },
                  { label: 'NIK', value: detail.mother_nik },
                  { label: 'Pekerjaan', value: detail.mother_job },
                  { label: 'Pendidikan Terakhir', value: detail.mother_graduate },
                  { label: 'Penghasilan', value: detail.mother_income },
                ])
              "
            />
          </SantriDetailSection>

          <!-- Wali -->
          <SantriDetailSection title="Wali">
            <SantriDetailGrid
              :fields="
                fields([
                  { label: 'Hubungan', value: detail.guardian_relationship },
                  { label: 'Nama', value: detail.guardian },
                  { label: 'No. HP', value: detail.guardian_pn },
                  { label: 'NIK', value: detail.guardian_nik },
                  { label: 'Pekerjaan', value: detail.guardian_job },
                  { label: 'Pendidikan Terakhir', value: detail.guardian_graduate },
                  { label: 'Penghasilan', value: detail.guardian_income },
                ])
              "
            />
          </SantriDetailSection>

          <div class="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-gray-700/50 dark:text-gray-400">
            <span>Dibuat: {{ formatDateTime(detail.created_at) }}</span>
            <span>Diperbarui: {{ formatDateTime(detail.updated_at) }}</span>
          </div>
        </div>

        <div class="border-t border-gray-200 px-6 py-4 dark:border-gray-700/50">
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="soft" @click="close">Tutup</UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

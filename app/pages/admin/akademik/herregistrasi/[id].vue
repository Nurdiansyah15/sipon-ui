<script setup lang="ts">
import { useAkademikStore } from '~/stores/akademik'
import { parseApiError } from '~/utils/errorParser'
import type { SantriRegistration } from '#shared/types/Akademik'
import type { HerregistrasiDocument, HerregistrasiDocumentRequirement } from '#shared/types/AkademikSantri'

definePageMeta({ layout: 'akademik' })

const route = useRoute()
const id = computed(() => (route.params as Record<string, string>).id ?? '')

const store = useAkademikStore()
const toast = useToast()

const loading = ref(true)
const notFound = ref(false)
const registration = ref<SantriRegistration | null>(null)
const requirements = ref<HerregistrasiDocumentRequirement[]>([])
const documents = ref<HerregistrasiDocument[]>([])

const revisionOpen = ref(false)
const revisionNotes = ref('')
const rejectDoc = ref<HerregistrasiDocument | null>(null)
const rejectOpen = ref(false)
const rejectNotes = ref('')
const confirmOpen = ref(false)
const confirmAction = ref<'complete' | 'cancel'>('complete')

const isSubmitting = computed(() => store.isSubmitting)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    registration.value = await store.fetchRegistration(id.value)
    await Promise.all([
      store.fetchPeriodDocRequirements(registration.value.academic_period_id),
      store.fetchRegistrationDocuments(id.value),
    ])
    requirements.value = store.periodDocRequirements
    documents.value = store.registrationDocuments
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)

function docFor(kind: string): HerregistrasiDocument | undefined {
  return documents.value.find(d => d.kind === kind)
}

const missingRequired = computed(() => {
  const present = new Set(documents.value.map(d => d.kind))
  return requirements.value
    .filter(r => r.is_required && !present.has(r.kind))
    .map(r => r.label)
})

const unverifiedRequired = computed(() => {
  return requirements.value.filter((r) => {
    if (!r.is_required) return false
    const doc = docFor(r.kind)
    return !doc || doc.status !== 'verified'
  }).map(r => r.label)
})

const canComplete = computed(() =>
  registration.value?.status === 'pending' || registration.value?.status === 'revision'
    ? unverifiedRequired.value.length === 0
    : false,
)

function statusColor(status: string) {
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

function statusLabel(status: string) {
  if (status === 'verified') return 'Terverifikasi'
  if (status === 'rejected') return 'Ditolak'
  return 'Menunggu Verifikasi'
}

async function verifyDoc(doc: HerregistrasiDocument) {
  try {
    await store.verifyRegistrationDocument(id.value, doc.id)
    toast.add({ title: 'Dokumen diverifikasi', color: 'success' })
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal verifikasi', description: parseApiError(err), color: 'error' })
  }
}

function openReject(doc: HerregistrasiDocument) {
  rejectDoc.value = doc
  rejectNotes.value = ''
  rejectOpen.value = true
}

async function submitReject() {
  if (!rejectDoc.value) return
  try {
    await store.rejectRegistrationDocument(id.value, rejectDoc.value.id, rejectNotes.value)
    toast.add({ title: 'Dokumen ditolak', color: 'success' })
    rejectOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal menolak dokumen', description: parseApiError(err), color: 'error' })
  }
}

function openRevision() {
  revisionNotes.value = ''
  revisionOpen.value = true
}

async function submitRevision() {
  try {
    await store.requestRevision(id.value, revisionNotes.value)
    toast.add({ title: 'Revisi diminta', color: 'success' })
    revisionOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal meminta revisi', description: parseApiError(err), color: 'error' })
  }
}

function openConfirm(action: 'complete' | 'cancel') {
  confirmAction.value = action
  confirmOpen.value = true
}

async function runConfirm() {
  try {
    if (confirmAction.value === 'complete') {
      await store.completeRegistration(id.value)
      toast.add({ title: 'Herregistrasi diselesaikan', color: 'success' })
    } else {
      await store.cancelRegistration(id.value)
      toast.add({ title: 'Herregistrasi dibatalkan', color: 'success' })
    }
    confirmOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal mengubah status', description: parseApiError(err), color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <UButton to="/admin/akademik/herregistrasi" icon="i-lucide-arrow-left" variant="ghost" class="mb-4">
      Kembali ke Herregistrasi
    </UButton>

    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-32 w-full" />
      <USkeleton class="h-40 w-full" />
    </div>

    <div v-else-if="notFound" class="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-search-x" class="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Herregistrasi Tidak Ditemukan</h2>
    </div>

    <template v-else-if="registration">
      <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Detail Herregistrasi</h1>
          <p class="mt-1 text-sm text-gray-500">
            {{ registration.santri_name ?? '-' }}
            <template v-if="registration.santri_nis">({{ registration.santri_nis }})</template>
            · {{ registration.period_name || '-' }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <AkademikStatusBadge :status="registration.status" type="registration" size="sm" />
        </div>
      </div>

      <p
        v-if="registration.status === 'revision' && registration.revision_notes"
        class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
      >
        <span class="font-medium">Catatan revisi:</span> {{ registration.revision_notes }}
      </p>

      <!-- Blokir alasan belum bisa selesai -->
      <div
        v-if="(registration.status === 'pending' || registration.status === 'revision') && unverifiedRequired.length > 0"
        class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
      >
        <p class="font-medium">Belum bisa diselesaikan. Dokumen wajib berikut belum terverifikasi:</p>
        <ul class="mt-1 list-inside list-disc">
          <li v-for="label in unverifiedRequired" :key="label">{{ label }}</li>
        </ul>
      </div>

      <!-- Dokumen -->
      <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700/50">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100">Dokumen Herregistrasi</h2>
        </div>
        <div class="divide-y divide-gray-100 p-2 dark:divide-gray-700/50">
          <div v-if="requirements.length === 0" class="p-6 text-center text-sm text-gray-500">
            Belum ada dokumen yang ditetapkan untuk periode ini.
          </div>

          <div v-for="req in requirements" :key="req.id" class="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-gray-100">{{ req.label }}</p>
                <UBadge :color="req.is_required ? 'error' : 'neutral'" variant="subtle" size="xs">
                  {{ req.is_required ? 'Wajib' : 'Opsional' }}
                </UBadge>
              </div>

              <template v-if="docFor(req.kind)">
                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <span class="truncate text-xs text-gray-600 dark:text-gray-400">{{ docFor(req.kind)?.original_filename || '-' }}</span>
                  <UBadge :color="statusColor(docFor(req.kind)!.status)" variant="subtle" size="sm">
                    {{ statusLabel(docFor(req.kind)!.status) }}
                  </UBadge>
                </div>
                <p v-if="docFor(req.kind)?.status === 'rejected' && docFor(req.kind)?.notes" class="mt-1 text-xs text-red-600 dark:text-red-400">
                  Alasan: {{ docFor(req.kind)?.notes }}
                </p>
              </template>
              <p v-else class="mt-1 text-xs text-gray-400 dark:text-gray-500">Belum di-upload</p>
            </div>

            <div v-if="docFor(req.kind)" class="flex shrink-0 items-center gap-2">
              <UButton v-if="docFor(req.kind)!.status !== 'verified'" variant="soft" size="xs" icon="i-lucide-check" @click="verifyDoc(docFor(req.kind)!)">
                Verifikasi
              </UButton>
              <UButton v-if="docFor(req.kind)!.status !== 'verified'" variant="ghost" size="xs" color="error" icon="i-lucide-x" @click="openReject(docFor(req.kind)!)">
                Tolak
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Aksi -->
      <div
        v-if="registration.status === 'pending' || registration.status === 'revision'"
        class="mt-6 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900"
      >
        <UButton
          icon="i-lucide-check-circle"
          class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
          :disabled="!canComplete"
          @click="openConfirm('complete')"
        >
          Terima Herregistrasi
        </UButton>
        <UButton icon="i-lucide-rotate-ccw" variant="outline" @click="openRevision">
          Minta Revisi
        </UButton>
        <UButton icon="i-lucide-x-circle" variant="outline" color="error" @click="openConfirm('cancel')">
          Batalkan
        </UButton>
      </div>
    </template>
  </div>

  <!-- Modal revisi -->
  <UModal :open="revisionOpen" @update:open="revisionOpen = $event">
    <template #content>
      <div class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Minta Revisi Herregistrasi</h3>
        <UFormField label="Catatan Revisi" required>
          <UTextarea v-model="revisionNotes" placeholder="Jelaskan dokumen apa yang perlu diperbaiki..." />
        </UFormField>
        <div class="mt-4 flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="revisionOpen = false">Batal</UButton>
          <UButton :loading="isSubmitting" :disabled="!revisionNotes.trim()" @click="submitRevision">Kirim</UButton>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Modal tolak dokumen -->
  <UModal :open="rejectOpen" @update:open="rejectOpen = $event">
    <template #content>
      <div class="p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Tolak Dokumen</h3>
        <p v-if="rejectDoc" class="mb-3 text-sm text-gray-500">{{ rejectDoc.original_filename || rejectDoc.kind }}</p>
        <UFormField label="Alasan Penolakan" required>
          <UTextarea v-model="rejectNotes" placeholder="mis. foto buram, dokumen tidak terbaca..." />
        </UFormField>
        <div class="mt-4 flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="rejectOpen = false">Batal</UButton>
          <UButton color="error" :loading="isSubmitting" :disabled="!rejectNotes.trim()" @click="submitReject">Tolak</UButton>
        </div>
      </div>
    </template>
  </UModal>

  <AdminConfirmActionModal
    :open="confirmOpen"
    :title="confirmAction === 'complete' ? 'Selesaikan Herregistrasi' : 'Batalkan Herregistrasi'"
    :description="confirmAction === 'complete'
      ? 'Semua dokumen wajib sudah terverifikasi. Tandai herregistrasi sebagai selesai?'
      : 'Yakin ingin membatalkan herregistrasi ini?'"
    confirm-label="Ya, Lanjutkan"
    :loading="isSubmitting"
    @update:open="confirmOpen = $event"
    @confirm="runConfirm"
  />
</template>

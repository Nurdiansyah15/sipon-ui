<script setup lang="ts">
import { usePsbAdminStore } from '~/stores/psbAdmin'
import { usePsbSettingStore } from '~/stores/psbSetting'

definePageMeta({ layout: 'psb' })

const route = useRoute()
const router = useRouter()
const store = usePsbAdminStore()
const settingStore = usePsbSettingStore()
const toast = useToast()

const id = computed(() => route.params.id as string)

const reviewModalOpen = ref(false)
const reviewMode = ref<'request-revision' | 'reject' | 'request-revision-daftar-ulang'>('request-revision')
const acceptModalOpen = ref(false)
const generateNisModalOpen = ref(false)

async function loadDetail() {
  try {
    await store.fetchPendaftaranDetail(id.value)
    await store.fetchDetailDokumen(id.value)
    await store.fetchDetailRiwayat(id.value)
    await settingStore.fetchSettings()
  } catch {
    router.push('/admin/psb/pendaftaran')
  }
}

onMounted(loadDetail)

const p = computed(() => store.selected)
const docs = computed(() => store.selectedDokumen)

const activeSetting = computed(() => settingStore.items.find(s => s.status === 'active'))
const activeQuota = computed(() => activeSetting.value?.quota)

function openReview(mode: typeof reviewMode.value) {
  reviewMode.value = mode
  reviewModalOpen.value = true
}

async function afterAction() {
  await loadDetail()
}

async function handleMarkNotReregistered() {
  try {
    await store.markNotReregistered(id.value)
    toast.add({ title: 'Pendaftar ditandai mengundurkan diri', color: 'success' })
    await loadDetail()
  } catch (err) {
    toast.add({ title: 'Gagal', color: 'error' })
  }
}

function canShow(status: string): boolean {
  return p.value?.status === status
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6">
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" @click="router.push('/admin/psb/pendaftaran')" />
    </div>

    <div v-if="store.isLoading && !p" class="space-y-4">
      <USkeleton class="h-48 w-full" />
      <USkeleton class="h-32 w-full" />
    </div>

    <template v-else-if="p">
      <!-- Header -->
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ p.nickname || 'Pendaftar' }}</h1>
            <PsbStatusBadge :status="p.status" size="md" />
          </div>
          <p class="mt-1 text-sm text-gray-500">
            {{ p.program || '—' }} · {{ p.gender === '1' ? 'Laki-laki' : 'Perempuan' }}
            <span v-if="p.nis" class="ml-4">NIS: <code>{{ p.nis }}</code></span>
          </p>
        </div>

        <!-- Action buttons status-driven -->
        <div class="flex flex-wrap gap-2">
          <template v-if="canShow('diajukan')">
            <UButton size="sm" color="warning" variant="soft" @click="openReview('request-revision')">Minta Revisi</UButton>
            <UButton size="sm" color="error" variant="soft" @click="openReview('reject')">Tolak</UButton>
            <UButton size="sm" color="success" @click="acceptModalOpen = true">Terima</UButton>
          </template>

          <template v-if="canShow('diterima')">
            <UButton size="sm" color="warning" @click="handleMarkNotReregistered">Mengundurkan Diri</UButton>
          </template>

          <template v-if="canShow('daftar_ulang')">
            <UButton size="sm" color="warning" variant="soft" @click="openReview('request-revision-daftar-ulang')">Minta Revisi</UButton>
            <UButton size="sm" color="primary" @click="generateNisModalOpen = true">Generate NIS</UButton>
          </template>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Dokumen panel -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 lg:col-span-2">
          <h2 class="mb-4 font-semibold text-gray-900 dark:text-gray-100">Dokumen</h2>
          <DokumenReviewPanel
            :pendaftar-id="id"
            :dokumen="docs"
            :loading="store.isLoading"
            :readonly="!canShow('diajukan')"
            @updated="loadDetail"
          />
        </div>

        <!-- Sidebar: Profile + Timeline -->
        <div class="space-y-6">
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <PsbProfileSummary :profile="p" :gender="p.gender" />
          </div>

          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 class="mb-3 font-semibold text-gray-900 dark:text-gray-100">Riwayat</h3>
            <PsbReviewTimeline :items="store.selectedReviews" />
          </div>
        </div>
      </div>

      <!-- Modals -->
      <ReviewActionModal
        v-model:open="reviewModalOpen"
        :pendaftar-id="id"
        :mode="reviewMode"
        @done="afterAction"
      />
      <AcceptConfirmModal
        v-model:open="acceptModalOpen"
        :pendaftar-id="id"
        :pendaftar-name="p.nickname || p.user_id"
        :program="p.program"
        :quota="activeQuota"
        @done="afterAction"
      />
      <GenerateNisConfirmModal
        v-model:open="generateNisModalOpen"
        :pendaftar-id="id"
        :pendaftar-name="p.nickname || p.user_id"
        @done="afterAction"
      />
    </template>
  </div>
</template>

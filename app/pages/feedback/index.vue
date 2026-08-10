<script setup lang="ts">
import { useFeedbackStore } from '~/stores/feedback'
import { parseApiError } from '~/utils/errorParser'
import type { FeedbackCategory } from '#shared/types/Feedback'

definePageMeta({ layout: 'default' })

const store = useFeedbackStore()
const toast = useToast()

const page = ref(1)
const limit = ref(10)
const categoryFilter = ref('__semua__')
const search = ref('')

const categoryOptions = [
  { label: 'Semua', value: '__semua__' },
  { label: 'Saran', value: 'saran' },
  { label: 'Pengaduan', value: 'pengaduan' },
  { label: 'Pertanyaan', value: 'pertanyaan' },
  { label: 'Apresiasi', value: 'apresiasi' },
  { label: 'Lainnya', value: 'lainnya' },
]

watch([page, categoryFilter], () => load(), { immediate: false })

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
})

async function load() {
  try {
    await store.fetchFeedbacks({
      page: page.value,
      limit: limit.value,
      category: categoryFilter.value !== '__semua__' ? (categoryFilter.value as FeedbackCategory) : undefined,
      search: search.value.trim() || undefined,
    })
  } catch (err) {
    toast.add({ title: 'Gagal memuat feedback', description: parseApiError(err), color: 'error' })
  }
}

onMounted(load)

const totalPages = computed(() => store.meta?.total_pages ?? 1)
const totalItems = computed(() => store.meta?.total ?? 0)

async function handleCardUpdated() {
  await load()
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Umpan Balik</h1>
        <p class="mt-1 text-sm text-gray-500">
          Sampaikan saran, pengaduan, pertanyaan, atau apresiasi Anda.
        </p>
      </div>
      <UButton icon="i-lucide-message-square-plus" size="lg" to="/feedback/create">Buat Feedback</UButton>
    </div>

    <div class="mb-6 flex flex-wrap gap-2">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Cari feedback..." class="w-64" />
      <USelect v-model="categoryFilter" :items="categoryOptions" class="w-40" />
      <UButton variant="ghost" icon="i-lucide-inbox" to="/feedback/my">Milik Saya</UButton>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-40 w-full" />
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ store.error }}</p>
      <UButton class="mt-4" variant="soft" @click="load">Coba Lagi</UButton>
    </div>

    <!-- Empty -->
    <div v-else-if="store.items.length === 0" class="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
      <UIcon name="i-lucide-message-square-off" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Belum Ada Feedback</h2>
      <p class="mt-2 text-sm text-gray-500">Jadilah yang pertama memberikan umpan balik.</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-4">
      <FeedbackCard v-for="item in store.items" :key="item.id" :item="item" @updated="handleCardUpdated" />
    </div>

    <!-- Pagination -->
    <div v-if="totalItems > 0" class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-500">
        Total {{ totalItems }} · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination v-model:page="page" :total="totalItems" :items-per-page="limit" :sibling-count="1" show-edges />
    </div>
  </div>
</template>

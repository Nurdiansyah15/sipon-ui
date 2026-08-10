<script setup lang="ts">
import { useFeedbackAdminStore } from '~/stores/feedbackAdmin'
import { parseApiError } from '~/utils/errorParser'
import type { FeedbackCategory } from '#shared/types/Feedback'

definePageMeta({ layout: 'feedback' })

const store = useFeedbackAdminStore()
const toast = useToast()

const page = ref(1)
const limit = ref(10)
const categoryFilter = ref('__semua__')
const search = ref('')
const takedownFilter = ref('__semua__')

const categoryOptions = [
  { label: 'Semua Kategori', value: '__semua__' },
  { label: 'Saran', value: 'saran' },
  { label: 'Pengaduan', value: 'pengaduan' },
  { label: 'Pertanyaan', value: 'pertanyaan' },
  { label: 'Apresiasi', value: 'apresiasi' },
  { label: 'Lainnya', value: 'lainnya' },
]

const takedownOptions = [
  { label: 'Semua Status', value: '__semua__' },
  { label: 'Aktif', value: 'active' },
  { label: 'Takedown', value: 'takedown' },
]

watch([page, categoryFilter, takedownFilter], () => load(), { immediate: false })

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

const filteredItems = computed(() => {
  if (takedownFilter.value === '__semua__') return store.items
  if (takedownFilter.value === 'takedown') return store.items.filter((f) => f.is_takedown)
  return store.items.filter((f) => !f.is_takedown)
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Moderasi Feedback</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Kelola feedback dan komentar: takedown konten yang tidak pantas, restore jika diperlukan.
      </p>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Cari feedback..." class="w-64" />
      <USelect v-model="categoryFilter" :items="categoryOptions" class="w-40" />
      <USelect v-model="takedownFilter" :items="takedownOptions" class="w-40" />
    </div>

    <div v-if="store.isLoading" class="space-y-4">
      <USkeleton v-for="i in 5" :key="i" class="h-32 w-full" />
    </div>

    <div v-else-if="store.error" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ store.error }}</p>
      <UButton class="mt-4" variant="soft" @click="load">Coba Lagi</UButton>
    </div>

    <div v-else-if="filteredItems.length === 0" class="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
      <UIcon name="i-lucide-inbox" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tidak Ada Data</h2>
      <p class="mt-2 text-sm text-gray-500">Tidak ada feedback yang cocok dengan filter.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="flex items-start gap-4 rounded-lg border p-4 dark:border-gray-700/50"
        :class="item.is_takedown
          ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50'
          : 'border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900'"
      >
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <FeedbackCategoryBadge :category="item.category" size="sm" />
            <UBadge v-if="item.is_takedown" color="error" variant="subtle" size="sm">Takedown</UBadge>
            <span class="text-xs text-gray-400">
              {{ item.user?.fullname || item.user?.username || 'Pengguna' }} ·
              {{ new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }}
            </span>
          </div>
          <NuxtLink :to="`/admin/feedback/${item.id}`" class="mt-1 block">
            <h3 class="font-semibold text-gray-900 hover:text-teal-600 dark:text-gray-100 dark:hover:text-teal-400">
              {{ item.title }}
            </h3>
          </NuxtLink>
          <p class="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{{ item.body }}</p>
          <div class="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1"><UIcon name="i-lucide-thumbs-up" class="h-3.5 w-3.5" />{{ item.like_count }}</span>
            <span class="flex items-center gap-1"><UIcon name="i-lucide-message-circle" class="h-3.5 w-3.5" />{{ item.comment_count }}</span>
            <span class="flex items-center gap-1"><UIcon name="i-lucide-paperclip" class="h-3.5 w-3.5" />{{ item.attachment_count }}</span>
          </div>
          <p v-if="item.is_takedown && item.takedown_reason" class="mt-2 text-xs text-red-600 dark:text-red-400">
            Alasan: {{ item.takedown_reason }}
          </p>
        </div>

        <div class="flex shrink-0 flex-col gap-1.5">
          <UButton variant="ghost" size="xs" icon="i-lucide-eye" :to="`/admin/feedback/${item.id}`">Detail</UButton>
        </div>
      </div>
    </div>

    <div v-if="totalItems > 0" class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-500">
        Total {{ totalItems }} · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination v-model:page="page" :total="totalItems" :items-per-page="limit" :sibling-count="1" show-edges />
    </div>
  </div>
</template>

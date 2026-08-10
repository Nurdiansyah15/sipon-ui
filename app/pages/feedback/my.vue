<script setup lang="ts">
import { useFeedbackStore } from '~/stores/feedback'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'default' })

const store = useFeedbackStore()
const toast = useToast()

const page = ref(1)
const limit = ref(10)

async function load() {
  try {
    await store.fetchMyFeedbacks({ page: page.value, limit: limit.value })
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
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Feedback Saya</h1>
        <p class="mt-1 text-sm text-gray-500">
          Semua feedback yang pernah Anda buat, termasuk yang ditakedown.
        </p>
      </div>
      <UButton variant="ghost" icon="i-lucide-arrow-left" to="/feedback">Kembali</UButton>
    </div>

    <div v-if="store.isLoading" class="space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-40 w-full" />
    </div>

    <div v-else-if="store.error" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ store.error }}</p>
      <UButton class="mt-4" variant="soft" @click="load">Coba Lagi</UButton>
    </div>

    <div v-else-if="store.items.length === 0" class="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
      <UIcon name="i-lucide-message-square-off" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Belum Ada Feedback</h2>
      <p class="mt-2 text-sm text-gray-500">Anda belum pernah membuat feedback.</p>
      <UButton class="mt-4" icon="i-lucide-message-square-plus" to="/feedback/create">Buat Feedback</UButton>
    </div>

    <div v-else class="space-y-4">
      <FeedbackCard v-for="item in store.items" :key="item.id" :item="item" @updated="handleCardUpdated" />
    </div>

    <div v-if="totalItems > 0" class="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-500">
        Total {{ totalItems }} · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination v-model:page="page" :total="totalItems" :items-per-page="limit" :sibling-count="1" show-edges />
    </div>
  </div>
</template>

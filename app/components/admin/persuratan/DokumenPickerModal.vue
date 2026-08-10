<script setup lang="ts">
import { useDokumenAsetStore } from '~/stores/dokumenAset'
import type { DokumenAsetItem } from '#shared/types/DokumenAset'

const props = withDefaults(
  defineProps<{
    open: boolean
    excludeIds?: string[]
  }>(),
  { excludeIds: () => [] },
)

const emit = defineEmits<{
  'update:open': [boolean]
  selected: [dokumenAsetId: string]
}>()

const store = useDokumenAsetStore()

const search = ref('')
const page = ref(1)
const limit = ref(50)
const selectedId = ref('')
const isLoading = ref(false)

const availableItems = computed(() => store.items.filter((d) => !props.excludeIds.includes(d.id)))

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function load() {
  isLoading.value = true
  try {
    await store.fetchList({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
    })
  } catch {
    /* error in store */
  } finally {
    isLoading.value = false
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})

watch(
  () => props.open,
  (v) => {
    if (v) {
      search.value = ''
      page.value = 1
      selectedId.value = ''
      load()
    }
  },
)

function select(item: DokumenAsetItem) {
  selectedId.value = item.id
}

function confirm() {
  if (!selectedId.value) return
  emit('selected', selectedId.value)
  emit('update:open', false)
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tautkan Dokumen Aset</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="emit('update:open', false)" />
        </div>

        <div class="mb-4">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari dokumen…"
            variant="subtle"
            class="w-full"
          />
        </div>

        <div v-if="isLoading" class="flex justify-center py-10">
          <UIcon name="i-lucide-loader-circle" class="h-6 w-6 animate-spin text-teal-600" />
        </div>

        <div v-else-if="availableItems.length === 0" class="rounded-lg border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
          <UIcon name="i-lucide-file-x" class="mx-auto h-8 w-8 text-gray-400" />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {{ search ? 'Tidak ada dokumen yang cocok' : 'Belum ada dokumen aset' }}
          </p>
        </div>

        <div v-else class="max-h-80 space-y-1 overflow-y-auto pr-1">
          <button
            v-for="item in availableItems"
            :key="item.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition"
            :class="selectedId === item.id
              ? 'border-teal-500 bg-teal-50 dark:border-teal-500 dark:bg-teal-950/30'
              : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50'"
            @click="select(item)"
          >
            <UIcon name="i-lucide-file-text" class="h-5 w-5 shrink-0 text-gray-400" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ item.judul }}</p>
              <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ item.filename }}</p>
            </div>
            <span
              class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
              :class="selectedId === item.id
                ? 'border-teal-600 bg-teal-600 text-white'
                : 'border-gray-300 dark:border-gray-600'"
            >
              <UIcon v-if="selectedId === item.id" name="i-lucide-check" class="h-3 w-3" />
            </span>
          </button>
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <UButton color="neutral" variant="outline" @click="emit('update:open', false)">Batal</UButton>
          <UButton color="primary" :disabled="!selectedId" @click="confirm">Tautkan</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

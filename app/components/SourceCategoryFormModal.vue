<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useArticleStore } from '~/stores/article'
import type { SourceCategoryItem, CategoryItem, CreateSourceCategoryRequest, UpdateSourceCategoryRequest } from '#shared/types/Article'

const props = defineProps<{
  open: boolean
  category: SourceCategoryItem | null
  sourceId: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  saved: []
}>()

const store = useArticleStore()
const toast = useToast()

function close() {
  emit('update:open', false)
}

const isEdit = computed(() => props.category !== null)
const categories = ref<CategoryItem[]>([])

async function loadCategories() {
  try {
    categories.value = await store.fetchCategories()
  } catch { /* ignore */ }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    loadCategories()
  }
})

const schema = z.object({
  category_key: z.string().min(1, 'Key wajib diisi'),
  url_suffix: z.string().nullable().optional(),
  url_override: z.string().nullable().optional(),
  article_limit: z.number().min(1).max(100),
  is_active: z.boolean(),
  article_category_id: z.string().nullable().optional(),
  keywords: z.string().optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  category_key: '',
  url_suffix: '',
  url_override: '',
  article_limit: 10,
  is_active: true,
  article_category_id: null,
  keywords: '',
})

watch(() => props.open, (isOpen) => {
  if (isOpen && props.category) {
    state.category_key = props.category.category_key
    state.url_suffix = props.category.url_suffix
    state.url_override = props.category.url_override
    state.article_limit = props.category.article_limit
    state.is_active = props.category.is_active
    state.article_category_id = props.category.article_category_id
    state.keywords = (props.category.keywords || []).join(', ')
  } else if (isOpen) {
    state.category_key = ''
    state.url_suffix = ''
    state.url_override = ''
    state.article_limit = 10
    state.is_active = true
    state.article_category_id = null
    state.keywords = ''
  }
})

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    const keywords = (event.data.keywords || '')
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)

    const payload: CreateSourceCategoryRequest | UpdateSourceCategoryRequest = {
      category_key: event.data.category_key,
      url_suffix: event.data.url_suffix || null,
      url_override: event.data.url_override || null,
      article_limit: event.data.article_limit,
      is_active: event.data.is_active,
      article_category_id: event.data.article_category_id || null,
      keywords: keywords.length > 0 ? keywords : undefined,
    }

    if (isEdit.value && props.category) {
      await store.updateSourceCategory(props.category.id, payload)
      toast.add({ title: 'Kategori sumber berhasil diperbarui', color: 'success' })
    } else {
      await store.createSourceCategory(props.sourceId, payload as CreateSourceCategoryRequest)
      toast.add({ title: 'Kategori sumber berhasil dibuat', color: 'success' })
    }
    emit('saved')
  } catch (err) {
    toast.add({
      title: isEdit.value ? 'Gagal memperbarui kategori' : 'Gagal membuat kategori',
      description: store.error || undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

const categoryOptions = computed(() =>
  categories.value.map(c => ({ label: c.name, value: c.id }))
)
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? 'Edit Kategori Sumber' : 'Tambah Kategori Sumber' }}
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Key Kategori" name="category_key" required>
            <UInput v-model="state.category_key" class="w-full" placeholder="nasional, internasional, olahraga" />
          </UFormField>

          <UFormField label="URL Suffix" name="url_suffix">
            <UInput v-model="state.url_suffix" class="w-full" placeholder="/nasional/rss.xml" />
            <p class="mt-1 text-xs text-gray-500">Ditambahkan ke base URL sumber.</p>
          </UFormField>

          <UFormField label="URL Override" name="url_override">
            <UInput v-model="state.url_override" class="w-full" placeholder="https://full-url/rss" />
            <p class="mt-1 text-xs text-gray-500">Menggantikan base URL sepenuhnya.</p>
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Article Limit" name="article_limit">
              <UInput v-model.number="state.article_limit" type="number" class="w-full" />
            </UFormField>

            <UFormField label="Map ke Kategori Artikel" name="article_category_id">
              <USelect
                v-model="state.article_category_id"
                :items="categoryOptions"
                value-key="value"
                placeholder="Pilih kategori (opsional)"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Filter Keywords" name="keywords">
            <UInput v-model="state.keywords" class="w-full" placeholder="kata kunci 1, kata kunci 2" />
            <p class="mt-1 text-xs text-gray-500">
              Pisahkan dengan koma. Hanya artikel yang mengandung keyword ini (di judul/deskripsi) yang akan di-scrape. Kosongkan untuk ambil semua.
            </p>
          </UFormField>

          <UFormField label="Aktif" name="is_active">
            <div class="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                v-model="state.is_active"
                class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Kategori aktif (akan di-scrape saat trigger)</span>
            </div>
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="close">Batal</UButton>
            <UButton type="submit" :loading="isSubmitting">
              {{ isEdit ? 'Simpan' : 'Buat' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useArticleStore } from '~/stores/article'
import type { SourceListItem, CreateSourceRequest, UpdateSourceRequest } from '#shared/types/Article'

const props = defineProps<{
  open: boolean
  source: SourceListItem | null
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

const isEdit = computed(() => props.source !== null)

const schema = z.object({
  name: z.string().min(1, 'Nama sumber wajib diisi'),
  key: z.string().min(1, 'Key wajib diisi').regex(/^[a-z0-9_]+$/, 'Key hanya boleh huruf kecil, angka, dan underscore'),
  base_url: z.string().min(1, 'Base URL wajib diisi').url('URL tidak valid'),
  auto_publish: z.boolean(),
  is_active: z.boolean(),
  content_selector: z.string().nullable().optional(),
  author_selector: z.string().nullable().optional(),
  tags_selector: z.string().nullable().optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  key: '',
  base_url: '',
  auto_publish: false,
  is_active: true,
  content_selector: null,
  author_selector: null,
  tags_selector: null,
})

watch(() => props.open, (isOpen) => {
  if (isOpen && props.source) {
    state.name = props.source.name
    state.key = props.source.key
    state.base_url = props.source.base_url
    state.auto_publish = props.source.auto_publish
    state.is_active = props.source.is_active
    state.content_selector = props.source.selectors?.content_selector || null
    state.author_selector = props.source.selectors?.author_selector || null
    state.tags_selector = props.source.selectors?.tags_selector || null
  } else if (isOpen) {
    state.name = ''
    state.key = ''
    state.base_url = ''
    state.auto_publish = false
    state.is_active = true
    state.content_selector = null
    state.author_selector = null
    state.tags_selector = null
  }
})

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    const payload: CreateSourceRequest | UpdateSourceRequest = {
      name: event.data.name,
      key: event.data.key,
      base_url: event.data.base_url,
      auto_publish: event.data.auto_publish,
      is_active: event.data.is_active,
    }

    if (event.data.content_selector || event.data.author_selector || event.data.tags_selector) {
      payload.selectors = {
        content_selector: event.data.content_selector || null,
        author_selector: event.data.author_selector || null,
        tags_selector: event.data.tags_selector || null,
      }
    }

    if (isEdit.value && props.source) {
      await store.updateSource(props.source.id, payload)
      toast.add({ title: 'Sumber berhasil diperbarui', color: 'success' })
    } else {
      await store.createSource(payload as CreateSourceRequest)
      toast.add({ title: 'Sumber berhasil dibuat', color: 'success' })
    }
    emit('saved')
  } catch (err) {
    toast.add({
      title: isEdit.value ? 'Gagal memperbarui sumber' : 'Gagal membuat sumber',
      description: store.error || undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? 'Edit Sumber' : 'Tambah Sumber' }}
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Nama" name="name" required>
            <UInput v-model="state.name" class="w-full" placeholder="CNN Indonesia" />
          </UFormField>

          <UFormField label="Key" name="key" required>
            <UInput v-model="state.key" class="w-full" placeholder="cnn_indonesia" />
            <p class="mt-1 text-xs text-gray-500">Hanya huruf kecil, angka, dan underscore.</p>
          </UFormField>

          <UFormField label="Base URL" name="base_url" required>
            <UInput v-model="state.base_url" class="w-full" placeholder="https://www.cnnindonesia.com" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Auto Publish" name="auto_publish">
              <div class="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  v-model="state.auto_publish"
                  class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Otomatis publikasikan hasil scrape</span>
              </div>
            </UFormField>

            <UFormField label="Status" name="is_active">
              <div class="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  v-model="state.is_active"
                  class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Sumber aktif</span>
              </div>
            </UFormField>
          </div>

          <fieldset class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <legend class="text-sm font-medium text-gray-700 dark:text-gray-300">CSS Selector (Opsional)</legend>
            <p class="mb-3 text-xs text-gray-500">Digunakan untuk ekstraksi konten dari halaman artikel. Kosongkan untuk menggunakan deteksi otomatis.</p>

            <div class="space-y-3">
              <UFormField label="Content Selector" name="content_selector">
                <UInput v-model="state.content_selector" class="w-full" placeholder=".detail-content, article" />
              </UFormField>
              <UFormField label="Author Selector" name="author_selector">
                <UInput v-model="state.author_selector" class="w-full" placeholder=".author, .writer" />
              </UFormField>
              <UFormField label="Tags Selector" name="tags_selector">
                <UInput v-model="state.tags_selector" class="w-full" placeholder=".tags a" />
              </UFormField>
            </div>
          </fieldset>

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

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useArticleStore } from '~/stores/article'
import type { ArticleListItem, CategoryItem, CreateArticleRequest, UpdateArticleRequest } from '#shared/types/Article'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  article?: ArticleListItem | null
  categories: CategoryItem[]
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  created: []
  updated: []
}>()

const store = useArticleStore()
const toast = useToast()

function close() {
  emit('update:open', false)
}

const schema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  content: z.string().min(1, 'Konten wajib diisi'),
  summary: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  author: z.string().min(1, 'Penulis wajib diisi'),
  is_featured: z.boolean().optional(),
  status: z.enum(['draft', 'published']).optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  title: '',
  content: '',
  summary: null,
  category_id: null,
  author: '',
  is_featured: false,
  status: 'draft',
})

watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'edit' && props.article) {
    state.title = props.article.title
    state.content = ''
    state.summary = null
    state.category_id = props.article.category_id
    state.author = props.article.author
    state.is_featured = props.article.is_featured
    state.status = props.article.status as 'draft' | 'published'
    loadArticleContent()
  } else if (isOpen && props.mode === 'create') {
    state.title = ''
    state.content = ''
    state.summary = null
    state.category_id = null
    state.author = ''
    state.is_featured = false
    state.status = 'draft'
  }
})

async function loadArticleContent() {
  if (!props.article) return
  try {
    const api = useApi()
    const res = await api.get<any>(`/api/v1/web/articles/${props.article.id}`)
    state.content = res.data.content
    state.summary = res.data.summary
  } catch {
    // ignore
  }
}

const isSubmitting = ref(false)
const thumbnailKey = ref<string | null>(null)
const thumbnailPreview = ref<string | null>(null)
const isUploading = ref(false)

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  isUploading.value = true
  try {
    const presign = await store.presignThumbnail(file.type)
    
    await fetch(presign.presign_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })

    await store.confirmUpload(presign.key)
    
    thumbnailKey.value = presign.key
    thumbnailPreview.value = presign.public_url
    
    toast.add({ title: 'Thumbnail berhasil diupload', color: 'success' })
  } catch (err) {
    toast.add({
      title: 'Gagal mengupload thumbnail',
      description: parseApiError(err),
      color: 'error',
    })
  } finally {
    isUploading.value = false
    if (input) input.value = ''
  }
}

function removeThumbnail() {
  thumbnailKey.value = null
  thumbnailPreview.value = null
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    const payload: CreateArticleRequest | UpdateArticleRequest = {
      title: event.data.title,
      content: event.data.content,
      summary: event.data.summary || null,
      category_id: event.data.category_id || null,
      author: event.data.author,
      thumbnail_url: thumbnailKey.value || (props.mode === 'edit' ? props.article?.thumbnail_url : null) || null,
      is_featured: event.data.is_featured || false,
    }

    if (props.mode === 'create') {
      ;(payload as CreateArticleRequest).status = event.data.status
      await store.create(payload as CreateArticleRequest)
      toast.add({ title: 'Artikel berhasil dibuat', color: 'success' })
      emit('created')
    } else if (props.article) {
      await store.update(props.article.id, payload as UpdateArticleRequest)
      toast.add({ title: 'Artikel berhasil diperbarui', color: 'success' })
      emit('updated')
    }
  } catch (err) {
    toast.add({
      title: props.mode === 'create' ? 'Gagal membuat artikel' : 'Gagal memperbarui artikel',
      description: store.error || parseApiError(err),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

const categoryOptions = computed(() =>
  props.categories.map(c => ({ label: c.name, value: c.id }))
)
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="max-h-[90vh] overflow-y-auto p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ mode === 'create' ? 'Buat Artikel' : 'Edit Artikel' }}
          </h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="close"
          />
        </div>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Judul" name="title" required>
            <UInput v-model="state.title" class="w-full" placeholder="Masukkan judul artikel" />
          </UFormField>

          <UFormField label="Konten" name="content" required>
            <UTextarea
              v-model="state.content"
              :rows="10"
              class="w-full"
              placeholder="Tulis konten artikel..."
            />
          </UFormField>

          <UFormField label="Ringkasan" name="summary">
            <UTextarea
              v-model="state.summary"
              :rows="3"
              class="w-full"
              placeholder="Ringkasan singkat artikel (opsional)"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Penulis" name="author" required>
              <UInput v-model="state.author" class="w-full" placeholder="Nama penulis" />
            </UFormField>

            <UFormField label="Kategori" name="category_id">
              <USelect
                v-model="state.category_id"
                :items="categoryOptions"
                value-key="value"
                placeholder="Pilih kategori"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Thumbnail" name="thumbnail">
              <div class="space-y-2">
                <div v-if="thumbnailPreview" class="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  <img :src="thumbnailPreview" alt="Preview" class="h-full w-full object-cover" />
                  <UButton
                    color="error"
                    variant="solid"
                    size="xs"
                    icon="i-lucide-x"
                    class="absolute right-2 top-2"
                    @click="removeThumbnail"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileUpload"
                  ref="fileInput"
                />
                <UButton
                  :loading="isUploading"
                  icon="i-lucide-upload"
                  variant="outline"
                  block
                  @click="($refs.fileInput as HTMLInputElement)?.click()"
                >
                  {{ thumbnailPreview ? 'Ganti Thumbnail' : 'Upload Thumbnail' }}
                </UButton>
              </div>
            </UFormField>

            <div class="space-y-4">
              <UFormField label="Status" name="status">
                <USelect
                  v-model="state.status"
                  :items="[
                    { label: 'Draft', value: 'draft' },
                    { label: 'Publikasikan', value: 'published' },
                  ]"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Artikel Unggulan" name="is_featured">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    v-model="state.is_featured"
                    class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    Tampilkan sebagai artikel utama
                  </span>
                </div>
              </UFormField>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <UButton color="neutral" variant="ghost" @click="close">Batal</UButton>
            <UButton type="submit" :loading="isSubmitting">
              {{ mode === 'create' ? 'Buat' : 'Simpan' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

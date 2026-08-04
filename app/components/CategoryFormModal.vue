<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useArticleStore } from '~/stores/article'
import type { CategoryItem, CreateCategoryRequest, UpdateCategoryRequest } from '#shared/types/Article'

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  category?: CategoryItem | null
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
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  sort_order: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  slug: '',
  sort_order: 0,
  is_active: true,
})

watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'edit' && props.category) {
    state.name = props.category.name
    state.slug = props.category.slug
    state.sort_order = props.category.sort_order
    state.is_active = props.category.is_active
  } else if (isOpen && props.mode === 'create') {
    state.name = ''
    state.slug = ''
    state.sort_order = 0
    state.is_active = true
  }
})

watch(() => state.name, (newName) => {
  if (props.mode === 'create' && newName) {
    state.slug = newName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
})

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    if (props.mode === 'create') {
      const payload: CreateCategoryRequest = {
        name: event.data.name,
        slug: event.data.slug,
        sort_order: event.data.sort_order || 0,
      }
      await store.createCategory(payload)
      toast.add({ title: 'Kategori berhasil dibuat', color: 'success' })
      emit('created')
    } else if (props.category) {
      const payload: UpdateCategoryRequest = {
        name: event.data.name,
        slug: event.data.slug,
        sort_order: event.data.sort_order,
        is_active: event.data.is_active,
      }
      await store.updateCategory(props.category.id, payload)
      toast.add({ title: 'Kategori berhasil diperbarui', color: 'success' })
      emit('updated')
    }
  } catch (err) {
    toast.add({
      title: props.mode === 'create' ? 'Gagal membuat kategori' : 'Gagal memperbarui kategori',
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
            {{ mode === 'create' ? 'Tambah Kategori' : 'Edit Kategori' }}
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
          <UFormField label="Nama Kategori" name="name" required>
            <UInput v-model="state.name" class="w-full" placeholder="Masukkan nama kategori" />
          </UFormField>

          <UFormField label="Slug" name="slug" required>
            <UInput v-model="state.slug" class="w-full" placeholder="nama-kategori" />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Slug akan otomatis dibuat dari nama. Hanya huruf kecil, angka, dan tanda hubung.
            </p>
          </UFormField>

          <UFormField label="Urutan" name="sort_order">
            <UInput v-model.number="state.sort_order" type="number" class="w-full" placeholder="0" />
          </UFormField>

          <UFormField v-if="mode === 'edit'" label="Status" name="is_active">
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="state.is_active"
                class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Aktif</span>
            </div>
          </UFormField>

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

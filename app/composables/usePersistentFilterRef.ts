import type { Ref } from 'vue'

/**
 * Persisten menyimpan nilai filter di memori modul (per route + key) sehingga
 * nilai tetap bertahan saat keluar-masuk halaman dalam satu sesi SPA, tetapi
 * kembali ke nilai awal saat halaman di-reload.
 *
 * Berbeda dengan `useQueryParamRef` yang menyimpan nilai di URL (bertahan
 * saat reload, hilang saat pindah menu), composable ini memenuhi kebutuhan:
 * filter tetap saat berpindah menu, reset saat reload.
 */
const memoryCache = new Map<string, string | number>()

export function usePersistentFilterRef<T extends string | number>(
  key: string,
  initial: T,
  options?: { serialize?: (v: T) => string | number | null | undefined },
): Ref<T> {
  const route = useRoute()
  const cacheKey = `${route.path}::${key}`

  const serialize = options?.serialize ?? ((v: T) => v)

  const cached = memoryCache.get(cacheKey) as T | undefined
  const value = ref<T>(cached ?? initial) as Ref<T>

  watch(value, (v) => {
    const serialized = serialize(v)
    if (serialized === undefined || serialized === null || serialized === '') {
      memoryCache.delete(cacheKey)
    } else {
      memoryCache.set(cacheKey, serialized)
    }
  })

  return value
}

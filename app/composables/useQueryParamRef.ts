import type { Ref } from 'vue'

/**
 * Sinkronkan sebuah ref dengan URL query param sehingga nilai filter
 * tetap ada saat halaman di-refresh atau dibagikan lewat link.
 *
 * - Nilai awal ref diambil dari `route.query[key]` bila ada.
 * - Setiap perubahan ref langsung ditulis ke URL (push dengan merge, tanpa
 *   menambah entri riwayat berlebihan via replace).
 */
export function useQueryParamRef<T extends string | number | null>(
  key: string,
  initial: T,
  options?: { parse?: (raw: string) => T; serialize?: (v: T) => string | undefined },
): Ref<T> {
  const route = useRoute()
  const router = useRouter()

  const parse = options?.parse ?? ((raw: string) => raw as T)
  const serialize = options?.serialize ?? ((v: T) => (v === null || v === '' ? undefined : String(v)))

  const raw = route.query[key]
  const value = ref<T>(typeof raw === 'string' ? parse(raw) : initial) as Ref<T>

  watch(
    value,
    (v) => {
      const next = { ...route.query }
      const serialized = serialize(v)
      if (serialized === undefined) {
        delete next[key]
      } else {
        next[key] = serialized
      }
      router.replace({ query: next })
    },
    { immediate: true },
  )

  return value
}

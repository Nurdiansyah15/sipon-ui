interface FetchErrorLike {
  data?: {
    errors?: string | Record<string, string>
    message?: string
  }
  message?: string
}

export function parseApiError(err: unknown, fallback = 'Terjadi kesalahan, silakan coba lagi.'): string {
  const error = err as FetchErrorLike
  const errors = error?.data?.errors

  if (typeof errors === 'string') return errors
  if (errors && typeof errors === 'object') {
    const firstField = Object.keys(errors)[0]
    if (firstField) return `${firstField}: ${errors[firstField]}`
  }

  return error?.data?.message || error?.message || fallback
}

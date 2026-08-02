interface FetchErrorLike {
  data?: {
    errors?: string | Record<string, string>
    message?: string
  }
  message?: string
  statusCode?: number
  status?: number
}

// getErrorStatus reads the HTTP status off an ofetch/$fetch error — used to
// branch on specific status codes (e.g. 404 "belum jadi santri" vs 409
// "sudah pernah mengajukan") instead of just showing a generic message.
export function getErrorStatus(err: unknown): number | undefined {
  const error = err as FetchErrorLike
  return error?.statusCode ?? error?.status
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

const PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CURRENT_PASSWORD: 'Kata sandi saat ini tidak sesuai.',
  PASSWORD_SAME_AS_CURRENT: 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.',
}

export function parsePasswordError(err: unknown, fallback = 'Gagal memperbarui kata sandi.'): string {
  const error = err as FetchErrorLike
  const code = error?.data?.errors
  if (typeof code === 'string' && PASSWORD_ERROR_MESSAGES[code]) {
    return PASSWORD_ERROR_MESSAGES[code]
  }
  return parseApiError(err, fallback)
}

/**
 * State collapse/expand sidebar desktop modul akademik.
 * Dibagikan antara AppAkademikNavbar (sidebar) dan layout akademik.vue
 * (padding konten) lewat useState global + persist localStorage.
 */
export function useAkademikSidebar() {
  const collapsed = useState<boolean>('akademik-sidebar-collapsed', () => {
    if (import.meta.client) {
      return localStorage.getItem('sipon-akademik-sidebar-collapsed') === '1'
    }
    return false
  })

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
    if (import.meta.client) {
      localStorage.setItem('sipon-akademik-sidebar-collapsed', collapsed.value ? '1' : '0')
    }
  }

  return { collapsed, toggleCollapsed }
}

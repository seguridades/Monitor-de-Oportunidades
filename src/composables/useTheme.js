import { useUIStore } from '@/stores/ui'

export function useTheme() {
  const ui = useUIStore()
  return {
    theme: ui.theme,
    toggleTheme: ui.toggleTheme,
    setTheme: ui.setTheme,
  }
}

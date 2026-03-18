import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useUIStore = defineStore('ui', () => {
  function getInitialTheme() {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const theme = ref(getInitialTheme())
  const sidebarOpen = ref(true)

  function applyTheme(val) {
    if (val === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(val) {
    theme.value = val
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  // Persist + apply on change
  watch(theme, (val) => {
    localStorage.setItem('theme', val)
    applyTheme(val)
  }, { immediate: true })

  return {
    theme,
    sidebarOpen,
    toggleTheme,
    setTheme,
    toggleSidebar,
  }
})

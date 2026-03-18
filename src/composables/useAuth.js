import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const auth = useAuthStore()
  return auth
}

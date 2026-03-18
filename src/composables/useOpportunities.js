import { useOpportunitiesStore } from '@/stores/opportunities'

export function useOpportunities() {
  const store = useOpportunitiesStore()
  return store
}

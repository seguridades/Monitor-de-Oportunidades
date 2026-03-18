import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/invite/:token',
    name: 'AcceptInvite',
    component: () => import('@/views/auth/AcceptInviteView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Opportunities',
        component: () => import('@/views/OpportunitiesView.vue'),
      },
      {
        path: 'my-list',
        name: 'MyList',
        component: () => import('@/views/MyListView.vue'),
      },
      {
        path: 'pending',
        name: 'Pending',
        component: () => import('@/views/PendingView.vue'),
        meta: { requiresRole: ['admin', 'member'] },
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/AdminView.vue'),
        meta: { requiresRole: ['admin'] },
      },
      {
        path: 'guide',
        name: 'Guide',
        component: () => import('@/views/GuideView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  // auth.init() is awaited in main.js before mount, so loading is always false here
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresRole && !to.meta.requiresRole.includes(authStore.role)) {
    return { name: 'Opportunities' }
  }

  if (to.name === 'Login' && authStore.isAuthenticated) {
    return { name: 'Opportunities' }
  }
})

export default router

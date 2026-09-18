import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    public?: boolean
    /** SUPER 전용 */
    superOnly?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginPage.vue'),
    meta: { title: '로그인', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/DashboardLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/dashboard/DashboardPage.vue'), meta: { title: '대시보드' } },
      { path: 'members', name: 'members', component: () => import('@/views/members/MembersPage.vue'), meta: { title: '회원 관리' } },
      { path: 'members/:memberId', name: 'member-detail', component: () => import('@/views/members/MemberDetailPage.vue'), meta: { title: '회원 상세' } },
      { path: 'spots', name: 'spots', component: () => import('@/views/spots/SpotsPage.vue'), meta: { title: '스팟 관리' } },
      { path: 'spots/:spotId', name: 'spot-detail', component: () => import('@/views/spots/SpotDetailPage.vue'), meta: { title: '스팟 상세' } },
      { path: 'notices', name: 'notices', component: () => import('@/views/notices/NoticesPage.vue'), meta: { title: '공지사항' } },
      { path: 'notices/new', name: 'notice-new', component: () => import('@/views/notices/NoticeFormPage.vue'), meta: { title: '공지 등록' } },
      { path: 'notices/:id', name: 'notice-edit', component: () => import('@/views/notices/NoticeFormPage.vue'), meta: { title: '공지 수정' } },
      { path: 'faqs', name: 'faqs', component: () => import('@/views/faqs/FaqsPage.vue'), meta: { title: 'FAQ' } },
      { path: 'recommended-routes', name: 'recommended-routes', component: () => import('@/views/recommended-routes/RecommendedRoutesPage.vue'), meta: { title: '추천 루트' } },
      { path: 'recommended-routes/new', name: 'recommended-route-new', component: () => import('@/views/recommended-routes/RecommendedRouteFormPage.vue'), meta: { title: '추천 루트 등록' } },
      { path: 'recommended-routes/:id', name: 'recommended-route-edit', component: () => import('@/views/recommended-routes/RecommendedRouteFormPage.vue'), meta: { title: '추천 루트 수정' } },
      { path: 'recommended-areas', name: 'recommended-areas', component: () => import('@/views/recommended-areas/RecommendedAreasPage.vue'), meta: { title: '추천 지역' } },
      { path: 'policies', name: 'policies', component: () => import('@/views/policies/PoliciesPage.vue'), meta: { title: '약관 관리' } },
      { path: 'policies/new', name: 'policy-new', component: () => import('@/views/policies/PolicyFormPage.vue'), meta: { title: '약관 등록' } },
      { path: 'policies/:id', name: 'policy-edit', component: () => import('@/views/policies/PolicyFormPage.vue'), meta: { title: '약관 수정' } },
      { path: 'inquiries', name: 'inquiries', component: () => import('@/views/inquiries/InquiriesPage.vue'), meta: { title: '1:1 문의' } },
      { path: 'inquiries/:id', name: 'inquiry-detail', component: () => import('@/views/inquiries/InquiryDetailPage.vue'), meta: { title: '문의 상세' } },
      { path: 'accounts', name: 'accounts', component: () => import('@/views/accounts/AccountsPage.vue'), meta: { title: '관리자 계정', superOnly: true } },
      { path: 'audit-logs', name: 'audit-logs', component: () => import('@/views/audit/AuditLogsPage.vue'), meta: { title: '감사 로그', superOnly: true } },
      { path: 'api-logs', name: 'api-logs', component: () => import('@/views/audit/ApiLogsPage.vue'), meta: { title: 'API 로그', superOnly: true } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.restore()

  if (to.meta.public) {
    return auth.isAuthenticated ? { name: 'dashboard' } : true
  }
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.superOnly && !auth.isSuper) {
    return { name: 'dashboard' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Moodi Admin` : 'Moodi Admin'
})

export default router

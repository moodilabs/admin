<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard, Users, MapPin, Route, Map, Megaphone, CircleHelp, FileText, MessageSquare, ShieldCheck, ScrollText, Activity, KeyRound, LogOut,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import PasswordChangeModal from '@/components/PasswordChangeModal.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const navItems = computed(() => [
  { name: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { name: 'members', label: '회원 관리', icon: Users },
  { name: 'spots', label: '스팟 관리', icon: MapPin },
  { name: 'recommended-routes', label: '추천 루트', icon: Route },
  { name: 'recommended-areas', label: '추천 지역', icon: Map },
  { name: 'notices', label: '공지사항', icon: Megaphone },
  { name: 'faqs', label: 'FAQ', icon: CircleHelp },
  { name: 'policies', label: '약관 관리', icon: FileText },
  { name: 'inquiries', label: '1:1 문의', icon: MessageSquare },
  ...(auth.isSuper
    ? [
        { name: 'accounts', label: '관리자 계정', icon: ShieldCheck },
        { name: 'audit-logs', label: '감사 로그', icon: ScrollText },
        { name: 'api-logs', label: 'API 로그', icon: Activity },
      ]
    : []),
])

/** 대시보드(`/`)는 정확히 일치할 때만, 나머지는 하위 경로(상세·등록 등)까지 활성으로 본다. */
function isActive(name: string) {
  return name === 'dashboard' ? route.path === '/' : route.path.startsWith(`/${name}`)
}

const passwordModalOpen = ref(false)

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex h-full">
    <aside class="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div class="flex h-14 items-center px-5 text-lg font-bold tracking-tight">Moodi Admin</div>
      <nav class="flex-1 space-y-1 px-3 py-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          :class="isActive(item.name) ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'"
        >
          <component :is="item.icon" class="size-4" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="border-t border-gray-200 p-4">
        <div class="truncate text-sm font-medium">{{ auth.me?.name }}</div>
        <div class="truncate font-mono text-xs text-gray-500">{{ auth.me?.loginId }}</div>
        <button
          type="button"
          class="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          @click="passwordModalOpen = true"
        >
          <KeyRound class="size-4" /> 비밀번호 변경
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          @click="handleLogout"
        >
          <LogOut class="size-4" /> 로그아웃
        </button>
      </div>
    </aside>
    <main class="min-w-0 flex-1 overflow-y-auto p-8">
      <RouterView />
    </main>

    <!-- 초기 비밀번호 상태면 닫을 수 없는 변경 모달을 띄운다 — 서버도 그 전까진 다른 API를 403으로 막는다 -->
    <PasswordChangeModal
      :open="auth.passwordChangeRequired || passwordModalOpen"
      :forced="auth.passwordChangeRequired"
      @close="passwordModalOpen = false"
    />

  </div>
</template>

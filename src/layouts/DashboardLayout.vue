<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  LayoutDashboard, Users, Megaphone, CircleHelp, FileText, MessageSquare, ShieldCheck, LogOut, KeyRound,
} from 'lucide-vue-next'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/error'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FormField from '@/components/common/FormField.vue'
import TextInput from '@/components/common/TextInput.vue'

const auth = useAuthStore()
const router = useRouter()

const navItems = computed(() => [
  { name: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { name: 'members', label: '회원 관리', icon: Users },
  { name: 'notices', label: '공지사항', icon: Megaphone },
  { name: 'faqs', label: 'FAQ', icon: CircleHelp },
  { name: 'policies', label: '약관 관리', icon: FileText },
  { name: 'inquiries', label: '1:1 문의', icon: MessageSquare },
  ...(auth.isSuper ? [{ name: 'accounts', label: '관리자 계정', icon: ShieldCheck }] : []),
])

const passwordOpen = ref(false)
const passwordSaving = ref(false)
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirm: '' })

function openPassword() {
  Object.assign(passwordForm, { currentPassword: '', newPassword: '', confirm: '' })
  passwordOpen.value = true
}

async function submitPassword() {
  if (passwordForm.newPassword !== passwordForm.confirm) {
    toast.error('새 비밀번호가 일치하지 않습니다.')
    return
  }
  passwordSaving.value = true
  try {
    await authApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
    toast.success('비밀번호를 변경했습니다.')
    passwordOpen.value = false
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    passwordSaving.value = false
  }
}

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
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          active-class="bg-gray-900 text-white hover:bg-gray-900"
        >
          <component :is="item.icon" class="size-4" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="border-t border-gray-200 p-4">
        <div class="truncate text-sm font-medium">{{ auth.me?.name }}</div>
        <div class="truncate text-xs text-gray-500">{{ auth.me?.email }} · {{ auth.me?.role }}</div>
        <button
          type="button"
          class="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          @click="openPassword"
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

    <BaseModal :open="passwordOpen" title="비밀번호 변경" @close="passwordOpen = false">
      <form id="password-form" class="space-y-4" @submit.prevent="submitPassword">
        <FormField label="현재 비밀번호" required>
          <TextInput v-model="passwordForm.currentPassword" type="password" required autocomplete="current-password" />
        </FormField>
        <FormField label="새 비밀번호" required hint="10자 이상">
          <TextInput v-model="passwordForm.newPassword" type="password" required :minlength="10" autocomplete="new-password" />
        </FormField>
        <FormField label="새 비밀번호 확인" required>
          <TextInput v-model="passwordForm.confirm" type="password" required :minlength="10" autocomplete="new-password" />
        </FormField>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="passwordOpen = false">취소</BaseButton>
        <BaseButton type="submit" form="password-form" :loading="passwordSaving">변경</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

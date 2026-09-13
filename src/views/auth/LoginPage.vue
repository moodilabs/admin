<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { getErrorCode, getErrorMessage } from '@/utils/error'
import BaseButton from '@/components/common/BaseButton.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const loginId = ref('')
const password = ref('')
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    await auth.login({ loginId: loginId.value.trim(), password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'ADMIN_ACCOUNT_LOCKED') {
      toast.error('로그인 실패 횟수 초과로 계정이 잠겼습니다. 15분 후 다시 시도해주세요.')
    } else {
      toast.error(getErrorMessage(error, '아이디 또는 비밀번호가 올바르지 않습니다.'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex h-full items-center justify-center">
    <form class="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm" @submit.prevent="handleSubmit">
      <div class="mb-6">
        <h1 class="text-xl font-bold">Moodi Admin</h1>
        <p class="mt-1 text-sm text-gray-500">관리자 계정으로 로그인하세요.</p>
      </div>
      <label class="block space-y-1">
        <span class="text-sm font-medium">아이디</span>
        <input v-model="loginId" type="text" required autocomplete="username" autocapitalize="none" spellcheck="false"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
      </label>
      <label class="block space-y-1">
        <span class="text-sm font-medium">비밀번호</span>
        <input v-model="password" type="password" required autocomplete="current-password"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
      </label>
      <BaseButton type="submit" :loading="loading" class="w-full">로그인</BaseButton>
    </form>
  </div>
</template>

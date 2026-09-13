<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { getErrorCode, getErrorMessage } from '@/utils/error'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FormField from '@/components/common/FormField.vue'
import TextInput from '@/components/common/TextInput.vue'

const props = defineProps<{
  open: boolean
  /** 초기 비밀번호 상태 — 닫을 수 없고 바꿔야만 진행할 수 있다 */
  forced?: boolean
}>()
const emit = defineEmits<{ close: [] }>()

const auth = useAuthStore()
const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const saving = ref(false)

watch(() => props.open, (open) => {
  if (open) Object.assign(form, { currentPassword: '', newPassword: '', confirmPassword: '' })
})

async function submit() {
  if (form.newPassword !== form.confirmPassword) {
    toast.error('새 비밀번호가 서로 다릅니다.')
    return
  }
  if (form.newPassword === form.currentPassword) {
    toast.error('현재 비밀번호와 다른 비밀번호를 입력하세요.')
    return
  }
  saving.value = true
  try {
    await auth.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
    toast.success('비밀번호를 변경했습니다.')
    emit('close')
  } catch (error) {
    const code = getErrorCode(error)
    toast.error(code === 'ADMIN_LOGIN_FAILED' ? '현재 비밀번호가 올바르지 않습니다.' : getErrorMessage(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" :title="forced ? '초기 비밀번호 변경' : '비밀번호 변경'" @close="!forced && emit('close')">
    <p v-if="forced" class="mb-4 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
      발급받은 초기 비밀번호로 로그인했습니다. 계속하려면 본인만 아는 비밀번호로 바꿔주세요.
    </p>
    <form id="password-change-form" class="space-y-4" @submit.prevent="submit">
      <FormField label="현재 비밀번호" required>
        <TextInput v-model="form.currentPassword" type="password" required autocomplete="current-password" />
      </FormField>
      <FormField label="새 비밀번호" required hint="10자 이상, 현재 비밀번호와 달라야 합니다.">
        <TextInput v-model="form.newPassword" type="password" required :minlength="10" autocomplete="new-password" />
      </FormField>
      <FormField label="새 비밀번호 확인" required>
        <TextInput v-model="form.confirmPassword" type="password" required :minlength="10" autocomplete="new-password" />
      </FormField>
    </form>
    <template #footer>
      <BaseButton v-if="forced" variant="secondary" @click="auth.logout().then(() => $router.push({ name: 'login' }))">로그아웃</BaseButton>
      <BaseButton v-else variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton type="submit" form="password-change-form" :loading="saving">변경</BaseButton>
    </template>
  </BaseModal>
</template>

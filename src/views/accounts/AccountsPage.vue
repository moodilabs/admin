<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { accountsApi } from '@/api/accounts.api'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/error'
import { formatDateTime } from '@/utils/format'
import { adminRoleLabel, toOptions } from '@/utils/labels'
import type { AdminAccount, AdminAccountCreateRequest } from '@/types/auth'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'
import TextInput from '@/components/common/TextInput.vue'
import SelectField from '@/components/common/SelectField.vue'

const auth = useAuthStore()
const accounts = ref<AdminAccount[]>([])
const loading = ref(false)

const columns = [
  { key: 'email', label: '이메일' },
  { key: 'name', label: '이름' },
  { key: 'role', label: '역할' },
  { key: 'status', label: '상태' },
  { key: 'lastLoginAt', label: '마지막 로그인' },
  { key: 'createdAt', label: '생성일' },
  { key: 'actions', label: '', class: 'text-right' },
]

async function load() {
  loading.value = true
  try {
    accounts.value = await accountsApi.list()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
onMounted(load)

// 생성
const createOpen = ref(false)
const creating = ref(false)
const form = reactive<AdminAccountCreateRequest>({ email: '', name: '', role: 'OPERATOR', password: '' })

function openCreate() {
  Object.assign(form, { email: '', name: '', role: 'OPERATOR', password: '' })
  createOpen.value = true
}

async function submitCreate() {
  creating.value = true
  try {
    await accountsApi.create({ ...form })
    toast.success('관리자 계정을 생성했습니다.')
    createOpen.value = false
    await load()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    creating.value = false
  }
}

// 상태 변경
async function toggleStatus(account: AdminAccount) {
  const next = account.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
  try {
    await accountsApi.updateStatus(account.id, next)
    toast.success(next === 'ACTIVE' ? '계정을 활성화했습니다.' : '계정을 비활성화했습니다.')
    await load()
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}
</script>

<template>
  <PageHeader title="관리자 계정" description="SUPER 관리자만 계정을 추가·비활성화할 수 있습니다.">
    <template #actions>
      <BaseButton @click="openCreate">계정 추가</BaseButton>
    </template>
  </PageHeader>

  <DataTable :columns="columns" :rows="accounts" :row-key="(r) => r.id" :loading="loading">
    <template #role="{ row }">
      <Badge :tone="row.role === 'SUPER' ? 'blue' : 'gray'">{{ adminRoleLabel[row.role] }}</Badge>
    </template>
    <template #status="{ row }">
      <Badge :tone="row.status === 'ACTIVE' ? 'green' : 'red'">{{ row.status === 'ACTIVE' ? '활성' : '비활성' }}</Badge>
    </template>
    <template #lastLoginAt="{ row }">{{ formatDateTime(row.lastLoginAt) }}</template>
    <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #actions="{ row }">
      <BaseButton
        v-if="row.id !== auth.me?.id"
        variant="secondary"
        class="!px-3 !py-1"
        @click="toggleStatus(row)"
      >
        {{ row.status === 'ACTIVE' ? '비활성화' : '활성화' }}
      </BaseButton>
    </template>
  </DataTable>

  <BaseModal :open="createOpen" title="관리자 계정 추가" @close="createOpen = false">
    <form id="create-account-form" class="space-y-4" @submit.prevent="submitCreate">
      <FormField label="이메일" required>
        <TextInput v-model="form.email" type="email" required autocomplete="off" />
      </FormField>
      <FormField label="이름" required>
        <TextInput v-model="form.name" required :maxlength="50" />
      </FormField>
      <FormField label="역할" required>
        <SelectField v-model="form.role" :options="toOptions(adminRoleLabel)" class="w-full" />
      </FormField>
      <FormField label="초기 비밀번호" required>
        <TextInput v-model="form.password" type="password" required autocomplete="new-password" />
      </FormField>
    </form>
    <template #footer>
      <BaseButton variant="secondary" @click="createOpen = false">취소</BaseButton>
      <BaseButton type="submit" form="create-account-form" :loading="creating">생성</BaseButton>
    </template>
  </BaseModal>
</template>

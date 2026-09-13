<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft } from 'lucide-vue-next'
import { membersApi } from '@/api/members.api'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/error'
import { formatDateTime, formatNumber } from '@/utils/format'
import { memberStatusLabel, memberStatusTone, providerLabel } from '@/utils/labels'
import type { MemberDetail } from '@/types/member'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import TextArea from '@/components/common/TextArea.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const memberId = String(route.params.memberId)

const member = ref<MemberDetail | null>(null)

async function load() {
  try {
    member.value = await membersApi.get(memberId)
  } catch (error) {
    toast.error(getErrorMessage(error))
    router.replace({ name: 'members' })
  }
}
onMounted(load)

type Action = 'suspend' | 'unsuspend' | 'withdraw'
const action = ref<Action | null>(null)
const reason = ref('')
const acting = ref(false)

const actionMeta: Record<Action, { title: string; message: string; confirm: string }> = {
  suspend: { title: '회원 정지', message: '정지된 회원은 로그인할 수 없습니다. 사유를 입력하세요.', confirm: '정지' },
  unsuspend: { title: '정지 해제', message: '회원의 정지를 해제하고 다시 활성 상태로 되돌립니다.', confirm: '해제' },
  withdraw: { title: '강제 탈퇴', message: '회원을 탈퇴 처리합니다. 저장 스팟·생성 루트가 삭제되며 되돌릴 수 없습니다.', confirm: '탈퇴 처리' },
}

function openAction(next: Action) {
  reason.value = ''
  action.value = next
}

async function confirmAction() {
  if (!action.value) return
  acting.value = true
  try {
    if (action.value === 'suspend') await membersApi.updateStatus(memberId, 'SUSPENDED', reason.value)
    else if (action.value === 'unsuspend') await membersApi.updateStatus(memberId, 'ACTIVE')
    else await membersApi.withdraw(memberId)
    toast.success(`${actionMeta[action.value].title} 처리했습니다.`)
    action.value = null
    await load()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <button type="button" class="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900" @click="router.push({ name: 'members' })">
    <ArrowLeft class="size-4" /> 회원 목록
  </button>

  <template v-if="member">
    <PageHeader :title="member.nickname ?? '(닉네임 없음)'">
      <template #actions>
        <Badge :tone="memberStatusTone[member.status]">{{ memberStatusLabel[member.status] }}</Badge>
        <template v-if="auth.isSuper && member.status !== 'WITHDRAWN'">
          <BaseButton v-if="member.status === 'SUSPENDED'" variant="secondary" @click="openAction('unsuspend')">정지 해제</BaseButton>
          <BaseButton v-else variant="secondary" @click="openAction('suspend')">정지</BaseButton>
          <BaseButton variant="danger" @click="openAction('withdraw')">강제 탈퇴</BaseButton>
        </template>
      </template>
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-3">
      <Card>
        <h2 class="mb-3 text-sm font-semibold">프로필</h2>
        <dl class="space-y-2 text-sm">
          <div><dt class="text-xs text-gray-500">회원 ID</dt><dd class="font-mono text-xs">{{ member.id }}</dd></div>
          <div><dt class="text-xs text-gray-500">이메일</dt><dd>{{ member.email ?? '-' }}</dd></div>
          <div><dt class="text-xs text-gray-500">가입 경로</dt><dd>{{ providerLabel[member.provider] }}</dd></div>
          <div><dt class="text-xs text-gray-500">국가</dt><dd>{{ member.country ?? '-' }}</dd></div>
          <div><dt class="text-xs text-gray-500">가입일</dt><dd>{{ formatDateTime(member.createdAt) }}</dd></div>
          <div><dt class="text-xs text-gray-500">선호 무드</dt>
            <dd class="mt-1 flex flex-wrap gap-1">
              <Badge v-for="mood in member.preferredMoods" :key="mood" tone="blue">{{ mood }}</Badge>
              <span v-if="member.preferredMoods.length === 0" class="text-gray-400">-</span>
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 class="mb-3 text-sm font-semibold">활동</h2>
        <dl class="grid grid-cols-3 gap-3 text-center">
          <div><dt class="text-xs text-gray-500">북마크</dt><dd class="text-xl font-bold">{{ formatNumber(member.bookmarkCount) }}</dd></div>
          <div><dt class="text-xs text-gray-500">루트</dt><dd class="text-xl font-bold">{{ formatNumber(member.routeCount) }}</dd></div>
          <div><dt class="text-xs text-gray-500">문의</dt><dd class="text-xl font-bold">{{ formatNumber(member.inquiryCount) }}</dd></div>
        </dl>
        <h2 class="mt-6 mb-3 text-sm font-semibold">약관 동의</h2>
        <ul class="space-y-1 text-sm">
          <li v-for="a in member.policyAgreements" :key="a.type" class="flex justify-between">
            <span>{{ a.type }}</span><span class="text-xs text-gray-500">{{ formatDateTime(a.agreedAt) }}</span>
          </li>
          <li v-if="member.policyAgreements.length === 0" class="text-gray-400">-</li>
        </ul>
      </Card>

      <Card>
        <h2 class="mb-3 text-sm font-semibold">상태 이력</h2>
        <dl class="space-y-2 text-sm">
          <template v-if="member.suspendedAt">
            <div><dt class="text-xs text-gray-500">정지일</dt><dd>{{ formatDateTime(member.suspendedAt) }}</dd></div>
            <div><dt class="text-xs text-gray-500">정지 사유</dt><dd>{{ member.suspendReason ?? '-' }}</dd></div>
          </template>
          <template v-if="member.deletedAt">
            <div><dt class="text-xs text-gray-500">탈퇴일</dt><dd>{{ formatDateTime(member.deletedAt) }}</dd></div>
            <div><dt class="text-xs text-gray-500">탈퇴 사유</dt><dd>{{ member.withdrawalReason ?? '-' }}</dd></div>
          </template>
          <p v-if="!member.suspendedAt && !member.deletedAt" class="text-gray-400">이력이 없습니다.</p>
        </dl>
      </Card>
    </div>
  </template>

  <ConfirmDialog
    :open="action !== null"
    :title="action ? actionMeta[action].title : ''"
    :message="action ? actionMeta[action].message : ''"
    :confirm-label="action ? actionMeta[action].confirm : ''"
    :danger="action !== 'unsuspend'"
    :loading="acting"
    @confirm="confirmAction"
    @cancel="action = null"
  >
    <TextArea v-if="action === 'suspend'" v-model="reason" :rows="3" :maxlength="200" placeholder="정지 사유 (200자 이내)" class="mt-3" />
  </ConfirmDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { policiesApi } from '@/api/policies.api'
import { getErrorMessage } from '@/utils/error'
import { formatDate, isFutureDate } from '@/utils/format'
import { policyLocaleLabel, policyTypeLabel, toOptions } from '@/utils/labels'
import type { PolicyLocale, PolicySummary, PolicyType } from '@/types/support'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import SelectField from '@/components/common/SelectField.vue'
import Toggle from '@/components/common/Toggle.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const type = ref<PolicyType | ''>('')
const locale = ref<PolicyLocale | ''>('')
const policies = ref<PolicySummary[]>([])
const loading = ref(false)

/** 언어 필터는 서버에 없어 클라이언트에서 거른다 — 버전 수가 적어 전체를 받아도 부담이 없다 */
const rows = computed(() => (locale.value ? policies.value.filter((p) => p.locale === locale.value) : policies.value))

async function load() {
  loading.value = true
  try {
    policies.value = await policiesApi.list(type.value || undefined)
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(type, load)

const columns = [
  { key: 'type', label: '약관', class: 'w-44' },
  { key: 'locale', label: '언어', class: 'w-16' },
  { key: 'version', label: '버전', class: 'w-20' },
  { key: 'effectiveAt', label: '시행일', class: 'w-32' },
  { key: 'state', label: '상태' },
  { key: 'enabled', label: '시행', class: 'w-20' },
  { key: 'visible', label: '공개', class: 'w-20' },
  { key: 'actions', label: '', class: 'w-24 text-right' },
]

/** 시행 여부·공개 상태는 시행된 버전도 바꿀 수 있는 유일한 필드라 목록에서 바로 토글한다 */
async function updatePublication(policy: PolicySummary, patch: Partial<Pick<PolicySummary, 'enabled' | 'visible'>>) {
  const next = { enabled: policy.enabled, visible: policy.visible, ...patch }
  try {
    await policiesApi.updatePublication(policy.id, next)
    policy.enabled = next.enabled
    policy.visible = next.visible
    toast.success('공개 상태를 변경했습니다.')
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}

const deleteTarget = ref<PolicySummary | null>(null)
const deleting = ref(false)
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await policiesApi.remove(deleteTarget.value.id)
    toast.success('약관 버전을 삭제했습니다.')
    deleteTarget.value = null
    await load()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <PageHeader title="약관 관리">
    <template #actions>
      <BaseButton @click="router.push({ name: 'policy-new' })">새 버전 등록</BaseButton>
    </template>
  </PageHeader>

  <div class="mb-4 flex gap-2">
    <SelectField v-model="type" :options="toOptions(policyTypeLabel)" placeholder="전체 약관" />
    <SelectField v-model="locale" :options="toOptions(policyLocaleLabel)" placeholder="전체 언어" />
  </div>

  <DataTable
    :columns="columns"
    :rows="rows"
    :row-key="(r) => r.id"
    :loading="loading"
    clickable
    @row-click="(r) => router.push({ name: 'policy-edit', params: { id: r.id } })"
  >
    <template #type="{ row }">{{ policyTypeLabel[row.type] }}</template>
    <template #locale="{ row }">{{ policyLocaleLabel[row.locale] }}</template>
    <template #version="{ row }"><span class="font-mono">{{ row.version }}</span></template>
    <template #effectiveAt="{ row }">{{ formatDate(row.effectiveAt) }}</template>
    <template #state="{ row }">
      <Badge v-if="isFutureDate(row.effectiveAt.slice(0, 10))" tone="yellow">시행 예정</Badge>
      <Badge v-else-if="!row.enabled" tone="gray">시행 중지</Badge>
      <Badge v-else tone="green">시행 중</Badge>
    </template>
    <template #enabled="{ row }">
      <div @click.stop><Toggle :model-value="row.enabled" @update:model-value="(v) => updatePublication(row, { enabled: v })" /></div>
    </template>
    <template #visible="{ row }">
      <div @click.stop><Toggle :model-value="row.visible" @update:model-value="(v) => updatePublication(row, { visible: v })" /></div>
    </template>
    <template #actions="{ row }">
      <div class="flex justify-end" @click.stop>
        <BaseButton
          variant="danger"
          class="!px-3 !py-1"
          @click="deleteTarget = row"
        >삭제</BaseButton>
      </div>
    </template>
  </DataTable>

  <ConfirmDialog
    :open="deleteTarget !== null"
    title="약관 버전 삭제"
    :message="`${deleteTarget ? policyTypeLabel[deleteTarget.type] : ''} ${deleteTarget ? policyLocaleLabel[deleteTarget.locale] : ''} v${deleteTarget?.version}을 삭제합니다.`"
    confirm-label="삭제"
    danger
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="deleteTarget = null"
  />
</template>

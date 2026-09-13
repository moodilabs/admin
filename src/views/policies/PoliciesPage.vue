<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { policiesApi } from '@/api/policies.api'
import { getErrorMessage } from '@/utils/error'
import { formatDate, isFutureDate } from '@/utils/format'
import { policyTypeLabel, toOptions } from '@/utils/labels'
import type { PolicySummary, PolicyType } from '@/types/support'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import SelectField from '@/components/common/SelectField.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const type = ref<PolicyType | ''>('')
const policies = ref<PolicySummary[]>([])
const loading = ref(false)

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
  { key: 'type', label: '약관', class: 'w-48' },
  { key: 'version', label: '버전', class: 'w-24' },
  { key: 'effectiveAt', label: '시행일', class: 'w-32' },
  { key: 'state', label: '상태' },
  { key: 'actions', label: '', class: 'w-24 text-right' },
]

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

  <div class="mb-4">
    <SelectField v-model="type" :options="toOptions(policyTypeLabel)" placeholder="전체 약관" />
  </div>

  <DataTable
    :columns="columns"
    :rows="policies"
    :row-key="(r) => r.id"
    :loading="loading"
    clickable
    @row-click="(r) => router.push({ name: 'policy-edit', params: { id: r.id } })"
  >
    <template #type="{ row }">{{ policyTypeLabel[row.type] }}</template>
    <template #version="{ row }"><span class="font-mono">{{ row.version }}</span></template>
    <template #effectiveAt="{ row }">{{ formatDate(row.effectiveAt) }}</template>
    <template #state="{ row }">
      <Badge :tone="isFutureDate(row.effectiveAt.slice(0, 10)) ? 'yellow' : 'green'">
        {{ isFutureDate(row.effectiveAt.slice(0, 10)) ? '시행 예정' : '시행 중' }}
      </Badge>
    </template>
    <template #actions="{ row }">
      <div class="flex justify-end" @click.stop>
        <BaseButton
          v-if="isFutureDate(row.effectiveAt.slice(0, 10))"
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
    :message="`${deleteTarget ? policyTypeLabel[deleteTarget.type] : ''} v${deleteTarget?.version} (시행 예정)을 삭제합니다.`"
    confirm-label="삭제"
    danger
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="deleteTarget = null"
  />
</template>

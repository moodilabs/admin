<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { auditApi } from '@/api/audit.api'
import { accountsApi } from '@/api/accounts.api'
import { useCursorList } from '@/composables/useCursorList'
import { formatDateTime } from '@/utils/format'
import type { AuditLog } from '@/types/audit'
import type { AdminAccount } from '@/types/auth'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SelectField from '@/components/common/SelectField.vue'
import LoadMore from '@/components/common/LoadMore.vue'

const accounts = ref<AdminAccount[]>([])
const adminId = ref<string | ''>('')
const accountOptions = computed(() => accounts.value.map((a) => ({ value: a.id, label: `${a.name} (${a.loginId})` })))
const accountName = (id: string) => accounts.value.find((a) => a.id === id)?.name ?? id.slice(0, 8)

const list = useCursorList<AuditLog>((cursor) => auditApi.list({ adminId: adminId.value || undefined, cursor }))

onMounted(async () => {
  accounts.value = await accountsApi.list().catch(() => [])
  await list.reload()
})
watch(adminId, list.reload)

const methodTone = (m: string) => (m === 'DELETE' ? 'red' : m === 'POST' ? 'blue' : 'yellow')
const statusTone = (s: number) => (s >= 500 ? 'red' : s >= 400 ? 'yellow' : 'green')

const columns = [
  { key: 'createdAt', label: '일시', class: 'w-40' },
  { key: 'admin', label: '관리자', class: 'w-40' },
  { key: 'method', label: '메서드', class: 'w-24' },
  { key: 'path', label: '경로' },
  { key: 'statusCode', label: '결과', class: 'w-20' },
  { key: 'requestId', label: '요청 ID', class: 'w-48' },
]
</script>

<template>
  <PageHeader title="감사 로그" />

  <div class="mb-4 flex gap-2">
    <SelectField v-model="adminId" :options="accountOptions" placeholder="전체 관리자" />
  </div>

  <DataTable :columns="columns" :rows="list.items.value" :row-key="(r) => r.id" :loading="list.loading.value">
    <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #admin="{ row }">{{ accountName(row.adminId) }}</template>
    <template #method="{ row }"><Badge :tone="methodTone(row.method)">{{ row.method }}</Badge></template>
    <template #path="{ row }"><span class="font-mono text-xs">{{ row.path }}</span></template>
    <template #statusCode="{ row }"><Badge :tone="statusTone(row.statusCode)">{{ row.statusCode }}</Badge></template>
    <template #requestId="{ row }"><span class="font-mono text-xs text-gray-500">{{ row.requestId }}</span></template>
  </DataTable>
  <LoadMore :has-next="list.hasNext.value" :loading="list.loading.value" @more="list.loadMore" />
</template>

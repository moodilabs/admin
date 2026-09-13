<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi } from '@/api/audit.api'
import { useCursorList } from '@/composables/useCursorList'
import { formatDateTime } from '@/utils/format'
import type { ApiRequestLog } from '@/types/audit'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SelectField from '@/components/common/SelectField.vue'
import TextInput from '@/components/common/TextInput.vue'
import LoadMore from '@/components/common/LoadMore.vue'

const route = useRoute()
const router = useRouter()

// 회원 상세에서 `?memberId=`로 진입하면 그 회원만 본다
const memberId = ref(typeof route.query.memberId === 'string' ? route.query.memberId : '')
const method = ref<string | ''>('')
const path = ref('')
const statusClass = ref<number | ''>('')

const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ value: m, label: m }))
const statusOptions = [
  { value: 2, label: '2xx 성공' },
  { value: 4, label: '4xx 클라이언트 오류' },
  { value: 5, label: '5xx 서버 오류' },
]

const list = useCursorList<ApiRequestLog>((cursor) =>
  auditApi.apiLogs({
    memberId: memberId.value || undefined,
    method: method.value || undefined,
    path: path.value || undefined,
    statusClass: statusClass.value || undefined,
    cursor,
    size: 50,
  }),
)
onMounted(list.reload)
watch([method, statusClass], list.reload)

const methodTone = (m: string) => (m === 'DELETE' ? 'red' : m === 'GET' ? 'gray' : m === 'POST' ? 'blue' : 'yellow')
const statusTone = (s: number) => (s >= 500 ? 'red' : s >= 400 ? 'yellow' : 'green')
const durationClass = (ms: number) => (ms >= 1000 ? 'text-red-600 font-medium' : ms >= 300 ? 'text-yellow-700' : 'text-gray-500')

const columns = [
  { key: 'createdAt', label: '일시', class: 'w-40' },
  { key: 'member', label: '회원', class: 'w-56' },
  { key: 'method', label: '메서드', class: 'w-24' },
  { key: 'path', label: '경로' },
  { key: 'statusCode', label: '결과', class: 'w-20' },
  { key: 'durationMs', label: '처리 시간', class: 'w-24 text-right' },
  { key: 'requestId', label: '요청 ID', class: 'w-28' },
]
</script>

<template>
  <PageHeader title="API 로그" />

  <form class="mb-4 flex flex-wrap gap-2" @submit.prevent="list.reload">
    <TextInput v-model="memberId" placeholder="회원 ID" class="!w-72 font-mono" />
    <TextInput v-model="path" placeholder="경로 검색 (예: /routes)" class="!w-56" />
    <SelectField v-model="method" :options="methodOptions" placeholder="전체 메서드" />
    <SelectField v-model="statusClass" :options="statusOptions" placeholder="전체 결과" />
    <button type="submit" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">검색</button>
  </form>

  <DataTable :columns="columns" :rows="list.items.value" :row-key="(r) => r.id" :loading="list.loading.value">
    <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #member="{ row }">
      <button
        v-if="row.memberId"
        type="button"
        class="text-left hover:underline"
        @click="router.push({ name: 'member-detail', params: { memberId: row.memberId } })"
      >
        <div>{{ row.memberNickname ?? '(탈퇴)' }}</div>
        <div class="truncate text-xs text-gray-500">{{ row.memberEmail ?? row.memberId.slice(0, 8) }}</div>
      </button>
      <span v-else class="text-gray-400">비회원</span>
    </template>
    <template #method="{ row }"><Badge :tone="methodTone(row.method)">{{ row.method }}</Badge></template>
    <template #path="{ row }"><span class="font-mono text-xs">{{ row.path }}</span></template>
    <template #statusCode="{ row }"><Badge :tone="statusTone(row.statusCode)">{{ row.statusCode }}</Badge></template>
    <template #durationMs="{ row }"><span class="tabular-nums" :class="durationClass(row.durationMs)">{{ row.durationMs }}ms</span></template>
    <template #requestId="{ row }"><span class="font-mono text-xs text-gray-500">{{ row.requestId ?? '-' }}</span></template>
  </DataTable>
  <LoadMore :has-next="list.hasNext.value" :loading="list.loading.value" @more="list.loadMore" />
</template>

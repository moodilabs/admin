<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { inquiriesApi } from '@/api/inquiries.api'
import { useCursorList } from '@/composables/useCursorList'
import { formatDateTime } from '@/utils/format'
import { inquiryStatusLabel, toOptions } from '@/utils/labels'
import type { InquiryStatus, InquirySummary } from '@/types/support'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SelectField from '@/components/common/SelectField.vue'
import TextInput from '@/components/common/TextInput.vue'
import LoadMore from '@/components/common/LoadMore.vue'

const router = useRouter()
const status = ref<InquiryStatus | ''>('')
const topic = ref('')

const list = useCursorList<InquirySummary>((cursor) =>
  inquiriesApi.list({ status: status.value || undefined, topic: topic.value || undefined, cursor, size: 20 }),
)
onMounted(list.reload)
watch(status, list.reload)

const columns = [
  { key: 'status', label: '상태', class: 'w-24' },
  { key: 'topic', label: '유형', class: 'w-32' },
  { key: 'title', label: '제목' },
  { key: 'member', label: '회원', class: 'w-56' },
  { key: 'createdAt', label: '접수일', class: 'w-40' },
  { key: 'answeredAt', label: '답변일', class: 'w-40' },
]
</script>

<template>
  <PageHeader title="1:1 문의" description="MY-06 · 접수(RECEIVED) 문의가 먼저 정렬됩니다." />

  <form class="mb-4 flex gap-2" @submit.prevent="list.reload">
    <SelectField v-model="status" :options="toOptions(inquiryStatusLabel)" placeholder="전체 상태" />
    <TextInput v-model="topic" placeholder="유형 (topic)" class="!w-48" />
    <button type="submit" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">검색</button>
  </form>

  <DataTable
    :columns="columns"
    :rows="list.items.value"
    :row-key="(r) => r.id"
    :loading="list.loading.value"
    clickable
    @row-click="(r) => router.push({ name: 'inquiry-detail', params: { id: r.id } })"
  >
    <template #status="{ row }">
      <Badge :tone="row.status === 'RECEIVED' ? 'red' : 'green'">{{ inquiryStatusLabel[row.status] }}</Badge>
    </template>
    <template #member="{ row }">
      <template v-if="row.memberNickname || row.memberEmail">
        <div class="text-sm">{{ row.memberNickname ?? '-' }}</div>
        <div class="text-xs text-gray-500">{{ row.memberEmail }}</div>
      </template>
      <span v-else class="text-xs text-gray-400">탈퇴 회원</span>
    </template>
    <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #answeredAt="{ row }">{{ formatDateTime(row.answeredAt) }}</template>
  </DataTable>
  <LoadMore :has-next="list.hasNext.value" :loading="list.loading.value" @more="list.loadMore" />
</template>

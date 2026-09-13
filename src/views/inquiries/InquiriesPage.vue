<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inquiriesApi } from '@/api/inquiries.api'
import { useCursorList } from '@/composables/useCursorList'
import { formatDateTime } from '@/utils/format'
import { inquiryStatusLabel, inquiryTopicLabel, toOptions } from '@/utils/labels'
import type { InquiryStatus, InquirySummary, InquiryTopic } from '@/types/support'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SelectField from '@/components/common/SelectField.vue'
import LoadMore from '@/components/common/LoadMore.vue'

const route = useRoute()
const router = useRouter()
const status = ref<InquiryStatus | ''>(route.query.status === 'RECEIVED' || route.query.status === 'ANSWERED' ? route.query.status : '')
const topic = ref<InquiryTopic | ''>('')

const list = useCursorList<InquirySummary>((cursor) =>
  inquiriesApi.list({ status: status.value || undefined, topic: topic.value || undefined, cursor, size: 20 }),
)
onMounted(list.reload)
watch([status, topic], list.reload)

const columns = [
  { key: 'status', label: '상태', class: 'w-24' },
  { key: 'topic', label: '유형', class: 'w-32' },
  { key: 'subject', label: '제목' },
  { key: 'member', label: '회원', class: 'w-56' },
  { key: 'createdAt', label: '접수일', class: 'w-40' },
  { key: 'answeredAt', label: '답변일', class: 'w-40' },
]
</script>

<template>
  <PageHeader title="1:1 문의" />

  <div class="mb-4 flex gap-2">
    <SelectField v-model="status" :options="toOptions(inquiryStatusLabel)" placeholder="전체 상태" />
    <SelectField v-model="topic" :options="toOptions(inquiryTopicLabel)" placeholder="전체 유형" />
  </div>

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
    <template #topic="{ row }">{{ inquiryTopicLabel[row.topic] }}</template>
    <template #member="{ row }">
      <template v-if="row.member && !row.member.withdrawn">
        <div class="text-sm">{{ row.member.nickname ?? '-' }}</div>
        <div class="text-xs text-gray-500">{{ row.member.email ?? '-' }}</div>
      </template>
      <span v-else class="text-xs text-gray-400">탈퇴 회원</span>
    </template>
    <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #answeredAt="{ row }">{{ formatDateTime(row.answeredAt) }}</template>
  </DataTable>
  <LoadMore :has-next="list.hasNext.value" :loading="list.loading.value" @more="list.loadMore" />
</template>

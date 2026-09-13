<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { spotsApi } from '@/api/spots.api'
import { useCursorList } from '@/composables/useCursorList'
import { formatDateTime, formatNumber } from '@/utils/format'
import { spotContentTypeLabel, spotStatusLabel, spotStatusTone, toOptions } from '@/utils/labels'
import type { SpotStatus, SpotSummary } from '@/types/spot'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SelectField from '@/components/common/SelectField.vue'
import TextInput from '@/components/common/TextInput.vue'
import LoadMore from '@/components/common/LoadMore.vue'

const router = useRouter()
const keyword = ref('')
const area = ref('')
const status = ref<SpotStatus | ''>('')

const list = useCursorList<SpotSummary>((cursor) =>
  spotsApi.list({
    keyword: keyword.value || undefined,
    area: area.value || undefined,
    status: status.value || undefined,
    cursor,
    size: 20,
  }),
)
onMounted(list.reload)
watch(status, list.reload)

const columns = [
  { key: 'title', label: '스팟' },
  { key: 'contentType', label: '유형', class: 'w-28' },
  { key: 'location', label: '지역', class: 'w-40' },
  { key: 'status', label: '상태', class: 'w-24' },
  { key: 'routeExcluded', label: '루트', class: 'w-20' },
  { key: 'bookmarkCount', label: '북마크', class: 'w-20 text-right' },
  { key: 'createdAt', label: '수집일', class: 'w-40' },
]
</script>

<template>
  <PageHeader title="스팟 관리" />

  <form class="mb-4 flex gap-2" @submit.prevent="list.reload">
    <TextInput v-model="keyword" placeholder="제목 · 콘텐츠 ID 검색" class="!w-64" />
    <TextInput v-model="area" placeholder="지역 (예: 서울)" class="!w-36" />
    <SelectField v-model="status" :options="toOptions(spotStatusLabel)" placeholder="전체 상태" />
    <button type="submit" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">검색</button>
  </form>

  <DataTable
    :columns="columns"
    :rows="list.items.value"
    :row-key="(r) => r.id"
    :loading="list.loading.value"
    clickable
    @row-click="(r) => router.push({ name: 'spot-detail', params: { spotId: r.id } })"
  >
    <template #title="{ row }">
      <div class="font-medium">{{ row.title ?? '(제목 없음)' }}</div>
      <div class="font-mono text-xs text-gray-400">#{{ row.id }}</div>
    </template>
    <template #contentType="{ row }">{{ spotContentTypeLabel[row.contentType] }}</template>
    <template #location="{ row }">
      <span class="text-gray-600">{{ [row.area, row.district].filter(Boolean).join(' ') || '-' }}</span>
    </template>
    <template #status="{ row }">
      <Badge :tone="spotStatusTone[row.status]">{{ spotStatusLabel[row.status] }}</Badge>
    </template>
    <template #routeExcluded="{ row }">
      <span :class="row.routeExcluded ? 'text-gray-400' : 'text-gray-700'">{{ row.routeExcluded ? '제외' : '포함' }}</span>
    </template>
    <template #bookmarkCount="{ row }"><span class="tabular-nums">{{ formatNumber(row.bookmarkCount) }}</span></template>
    <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
  </DataTable>
  <LoadMore :has-next="list.hasNext.value" :loading="list.loading.value" @more="list.loadMore" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { membersApi } from '@/api/members.api'
import { useCursorList } from '@/composables/useCursorList'
import { formatDateTime } from '@/utils/format'
import { memberStatusLabel, memberStatusTone, providerLabel, toOptions } from '@/utils/labels'
import type { MemberStatus, MemberSummary, Provider } from '@/types/member'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import SelectField from '@/components/common/SelectField.vue'
import TextInput from '@/components/common/TextInput.vue'
import LoadMore from '@/components/common/LoadMore.vue'

const router = useRouter()
const keyword = ref('')
const status = ref<MemberStatus | ''>('')
const provider = ref<Provider | ''>('')

const list = useCursorList<MemberSummary>((cursor) =>
  membersApi.list({
    keyword: keyword.value || undefined,
    status: status.value || undefined,
    provider: provider.value || undefined,
    cursor,
    size: 20,
  }),
)
onMounted(list.reload)
watch([status, provider], list.reload)

const columns = [
  { key: 'nickname', label: '닉네임' },
  { key: 'email', label: '이메일' },
  { key: 'provider', label: '가입 경로', class: 'w-28' },
  { key: 'status', label: '상태', class: 'w-28' },
  { key: 'createdAt', label: '가입일', class: 'w-40' },
]
</script>

<template>
  <PageHeader title="회원 관리" />

  <form class="mb-4 flex gap-2" @submit.prevent="list.reload">
    <TextInput v-model="keyword" placeholder="닉네임 · 이메일 검색" class="!w-64" />
    <SelectField v-model="status" :options="toOptions(memberStatusLabel)" placeholder="전체 상태" />
    <SelectField v-model="provider" :options="toOptions(providerLabel)" placeholder="전체 경로" />
    <button type="submit" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">검색</button>
  </form>

  <DataTable
    :columns="columns"
    :rows="list.items.value"
    :row-key="(r) => r.id"
    :loading="list.loading.value"
    clickable
    @row-click="(r) => router.push({ name: 'member-detail', params: { memberId: r.id } })"
  >
    <template #nickname="{ row }">{{ row.nickname ?? '-' }}</template>
    <template #email="{ row }"><span class="text-gray-600">{{ row.email ?? '-' }}</span></template>
    <template #provider="{ row }">{{ providerLabel[row.provider] }}</template>
    <template #status="{ row }">
      <Badge :tone="memberStatusTone[row.status]">{{ memberStatusLabel[row.status] }}</Badge>
    </template>
    <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
  </DataTable>
  <LoadMore :has-next="list.hasNext.value" :loading="list.loading.value" @more="list.loadMore" />
</template>

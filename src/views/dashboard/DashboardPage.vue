<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { dashboardApi } from '@/api/dashboard.api'
import { membersApi } from '@/api/members.api'
import type { MemberDailyStat } from '@/types/member'
import { toDateInput } from '@/utils/format'
import { getErrorMessage } from '@/utils/error'
import { formatNumber } from '@/utils/format'
import type { Dashboard } from '@/types/dashboard'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'

const dashboard = ref<Dashboard | null>(null)
const loading = ref(true)

const stats = ref<MemberDailyStat[]>([])

onMounted(async () => {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 13)
  try {
    const [d, s] = await Promise.all([dashboardApi.get(), membersApi.stats(toDateInput(from), toDateInput(to))])
    dashboard.value = d
    stats.value = s
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
})

const maxStat = () => Math.max(1, ...stats.value.map((s) => Math.max(s.joined, s.withdrawn)))

const memberTiles = [
  ['total', '전체 회원'], ['active', '활성'], ['pending', '온보딩 중'],
  ['suspended', '정지'], ['withdrawn', '탈퇴'], ['newToday', '오늘 가입'], ['newLast7Days', '최근 7일 가입'],
] as const
const contentTiles = [
  ['spots', '스팟'], ['bookmarks', '북마크'], ['routes', '루트'], ['sharedRoutes', '공유 루트'], ['picks', '픽'],
] as const
</script>

<template>
  <PageHeader title="대시보드" />

  <div v-if="loading" class="text-sm text-gray-500">불러오는 중…</div>
  <div v-else-if="dashboard" class="space-y-8">
    <section>
      <h2 class="mb-3 text-sm font-semibold text-gray-500">회원</h2>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card v-for="[key, label] in memberTiles" :key="key">
          <div class="text-xs text-gray-500">{{ label }}</div>
          <div class="mt-1 text-2xl font-bold">{{ formatNumber(dashboard.members[key]) }}</div>
        </Card>
      </div>
    </section>
    <section>
      <h2 class="mb-3 text-sm font-semibold text-gray-500">콘텐츠</h2>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card v-for="[key, label] in contentTiles" :key="key">
          <div class="text-xs text-gray-500">{{ label }}</div>
          <div class="mt-1 text-2xl font-bold">{{ formatNumber(dashboard.content[key]) }}</div>
        </Card>
      </div>
    </section>
    <section>
      <h2 class="mb-3 text-sm font-semibold text-gray-500">문의</h2>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <div class="text-xs text-gray-500">미답변</div>
          <div class="mt-1 text-2xl font-bold text-red-600">{{ formatNumber(dashboard.inquiries.received) }}</div>
        </Card>
        <Card>
          <div class="text-xs text-gray-500">최근 7일 답변</div>
          <div class="mt-1 text-2xl font-bold">{{ formatNumber(dashboard.inquiries.answeredLast7Days) }}</div>
        </Card>
      </div>
    </section>
    <section v-if="stats.length">
      <h2 class="mb-3 text-sm font-semibold text-gray-500">최근 14일 가입 · 탈퇴</h2>
      <Card>
        <div class="flex h-40 items-end gap-2">
          <div v-for="s in stats" :key="s.date" class="flex flex-1 flex-col items-center gap-1" :title="`${s.date} 가입 ${s.joined} · 탈퇴 ${s.withdrawn}`">
            <div class="flex w-full items-end justify-center gap-0.5" style="height: 128px">
              <div class="w-2/5 rounded-t bg-gray-900" :style="{ height: `${(s.joined / maxStat()) * 100}%` }" />
              <div class="w-2/5 rounded-t bg-red-400" :style="{ height: `${(s.withdrawn / maxStat()) * 100}%` }" />
            </div>
            <span class="text-[10px] text-gray-400">{{ s.date.slice(5) }}</span>
          </div>
        </div>
        <div class="mt-2 flex gap-4 text-xs text-gray-500">
          <span class="inline-flex items-center gap-1"><span class="size-2 rounded-sm bg-gray-900" />가입</span>
          <span class="inline-flex items-center gap-1"><span class="size-2 rounded-sm bg-red-400" />탈퇴</span>
        </div>
      </Card>
    </section>
    <section>
      <h2 class="mb-3 text-sm font-semibold text-gray-500">최근 30일 탈퇴 사유</h2>
      <Card>
        <ul class="divide-y divide-gray-100 text-sm">
          <li v-for="(count, reason) in dashboard.withdrawalReasonsLast30Days" :key="reason" class="flex justify-between py-2">
            <span class="text-gray-700">{{ reason }}</span>
            <span class="font-medium">{{ formatNumber(count) }}</span>
          </li>
        </ul>
      </Card>
    </section>
  </div>
</template>

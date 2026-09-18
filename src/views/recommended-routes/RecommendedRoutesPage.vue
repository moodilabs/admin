<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ChevronDown, ChevronUp, Pencil, Trash2, ImageOff } from 'lucide-vue-next'
import { recommendedRoutesApi } from '@/api/recommended-routes.api'
import { getErrorCode, getErrorMessage } from '@/utils/error'
import type { RecommendedRoute } from '@/types/curation'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import Toggle from '@/components/common/Toggle.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'

/** 앱 메인 B 캐러셀은 노출 상태인 루트를 순서대로 3개만 보여준다 */
const APP_VISIBLE_LIMIT = 3

const router = useRouter()
const routes = ref<RecommendedRoute[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    routes.value = await recommendedRoutesApi.list()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
onMounted(load)

/** 노출 상태인 것 중 앞에서 3개가 실제 앱에 나간다 — 그 순위를 배지로 보여준다 */
const appRank = computed(() => {
  const rank = new Map<number, number>()
  routes.value.filter((r) => r.visible).slice(0, APP_VISIBLE_LIMIT).forEach((r, i) => rank.set(r.id, i + 1))
  return rank
})

function dayCount(route: RecommendedRoute) {
  return new Set(route.stops.map((s) => s.day)).size
}

async function run(action: () => Promise<unknown>, successMessage: string) {
  try {
    await action()
    toast.success(successMessage)
    await load()
    return true
  } catch (error) {
    if (getErrorCode(error) === 'SPOT_NOT_AVAILABLE') {
      toast.error('숨김·삭제된 스팟이 포함된 루트는 노출할 수 없습니다. 스팟을 교체하세요.')
    } else {
      toast.error(getErrorMessage(error))
    }
    return false
  }
}

// ── 순서 이동 (숨김 포함 전체 ID 배열을 sort_order=index 로 교체) ──
function move(index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= routes.value.length) return
  const ids = routes.value.map((r) => r.id)
  ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
  run(() => recommendedRoutesApi.reorder(ids), '노출 순서를 변경했습니다.')
}

function toggleVisible(route: RecommendedRoute, visible: boolean) {
  run(() => recommendedRoutesApi.updateVisibility(route.id, visible), visible ? '노출로 변경했습니다.' : '숨김으로 변경했습니다.')
}

// ── 삭제 ──
const deleteTarget = ref<RecommendedRoute | null>(null)
const deleting = ref(false)
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const ok = await run(() => recommendedRoutesApi.remove(deleteTarget.value!.id), '추천 루트를 삭제했습니다.')
  deleting.value = false
  if (ok) deleteTarget.value = null
}
</script>

<template>
  <PageHeader title="추천 루트">
    <template #actions>
      <BaseButton @click="router.push({ name: 'recommended-route-new' })">루트 등록</BaseButton>
    </template>
  </PageHeader>

  <p class="mb-4 text-sm text-gray-500">
    Discover 메인(선호 무드 미설정 사용자)의 추천 루트 캐러셀에 노출됩니다. 노출 상태인 루트 중 위에서 {{ APP_VISIBLE_LIMIT }}개만 앱에 나갑니다.
  </p>

  <div v-if="loading && routes.length === 0" class="text-sm text-gray-500">불러오는 중…</div>
  <EmptyState v-else-if="routes.length === 0" message="등록된 추천 루트가 없습니다." />

  <Card v-else class="!p-0">
    <ul class="divide-y divide-gray-100">
      <li
        v-for="(route, index) in routes"
        :key="route.id"
        class="flex cursor-pointer items-center gap-4 px-5 py-3 hover:bg-gray-50"
        @click="router.push({ name: 'recommended-route-edit', params: { id: route.id } })"
      >
        <span class="w-6 text-center font-mono text-xs text-gray-500">{{ index + 1 }}</span>
        <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <img v-if="route.imageUrl" :src="route.imageUrl" alt="" class="size-full object-cover" />
          <div v-else class="flex size-full items-center justify-center text-gray-300"><ImageOff class="size-5" /></div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate text-sm font-medium">{{ route.title }}</span>
            <Badge v-if="appRank.has(route.id)" tone="blue">앱 노출 {{ appRank.get(route.id) }}번째</Badge>
            <Badge v-else-if="!route.visible" tone="gray">숨김</Badge>
            <Badge v-else tone="yellow">노출 대기</Badge>
          </div>
          <p class="mt-0.5 text-xs text-gray-500">{{ route.region }} · {{ dayCount(route) }}일 · 스팟 {{ route.stops.length }}개</p>
        </div>
        <div class="flex shrink-0 items-center gap-1" @click.stop>
          <Toggle :model-value="route.visible" class="mr-2" @update:model-value="(v) => toggleVisible(route, v)" />
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="index === 0" @click="move(index, -1)"><ChevronUp class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="index === routes.length - 1" @click="move(index, 1)"><ChevronDown class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100" @click="router.push({ name: 'recommended-route-edit', params: { id: route.id } })"><Pencil class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-red-500 hover:bg-red-50" @click="deleteTarget = route"><Trash2 class="size-4" /></button>
        </div>
      </li>
    </ul>
  </Card>

  <ConfirmDialog
    :open="deleteTarget !== null"
    title="추천 루트 삭제"
    :message="`'${deleteTarget?.title}' 루트를 삭제합니다. 회원이 저장한 루트에는 영향이 없습니다.`"
    confirm-label="삭제"
    danger
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="deleteTarget = null"
  />
</template>

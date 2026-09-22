<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, ExternalLink } from 'lucide-vue-next'
import { spotsApi } from '@/api/spots.api'
import { getErrorMessage } from '@/utils/error'
import { formatDateTime, formatNumber } from '@/utils/format'
import { moodTagLabel, spotContentTypeLabel, spotStatusLabel, spotStatusTone } from '@/utils/labels'
import type { MoodTag, SpotDetail } from '@/types/spot'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import TextArea from '@/components/common/TextArea.vue'
import Toggle from '@/components/common/Toggle.vue'

const route = useRoute()
const router = useRouter()
const spotId = Number(route.params.spotId)

const spot = ref<SpotDetail | null>(null)

async function load() {
  try {
    spot.value = await spotsApi.get(spotId)
    moodDraft.value = [...(spot.value.mood?.tags ?? [])]
    descriptionDraft.value = spot.value.description ?? ''
  } catch (error) {
    toast.error(getErrorMessage(error))
    router.replace({ name: 'spots' })
  }
}
onMounted(load)

const primaryImage = computed(() => spot.value?.images.find((i) => i.primary) ?? spot.value?.images[0])
const naverMapUrl = computed(() =>
  spot.value?.latitude != null && spot.value?.longitude != null
    ? `https://map.naver.com/v5/search/${encodeURIComponent(spot.value.translation?.title ?? '')}?c=${spot.value.longitude},${spot.value.latitude},15,0,0,0,dh`
    : null,
)

// ─ 노출 상태
type Action = 'hide' | 'publish' | 'delete'
const action = ref<Action | null>(null)
const reason = ref('')
const acting = ref(false)
const actionMeta: Record<Action, { title: string; message: string; confirm: string }> = {
  hide: { title: '스팟 숨김', message: '앱에서 즉시 미노출됩니다. 다시 노출로 되돌릴 수 있습니다. 사유를 입력하세요.', confirm: '숨김' },
  publish: { title: '노출 복구', message: '스팟을 다시 앱에 노출합니다.', confirm: '노출' },
  delete: { title: '스팟 삭제', message: '영구 삭제 처리합니다. 되돌릴 수 없습니다. 사유를 입력하세요.', confirm: '삭제' },
}
function openAction(next: Action) {
  reason.value = ''
  action.value = next
}
async function confirmAction() {
  if (!action.value) return
  if (action.value !== 'publish' && !reason.value.trim()) {
    toast.error('사유를 입력하세요.')
    return
  }
  acting.value = true
  try {
    const status = action.value === 'hide' ? 'HIDDEN' : action.value === 'delete' ? 'DELETED' : 'PUBLISHED'
    await spotsApi.updateStatus(spotId, status, reason.value || undefined)
    toast.success(`${actionMeta[action.value].title} 처리했습니다.`)
    action.value = null
    await load()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    acting.value = false
  }
}

// ─ 루트 후보 제외
const routeIncluded = computed({
  get: () => !!spot.value && !spot.value.routeExcluded,
  set: async (included) => {
    if (!spot.value) return
    try {
      await spotsApi.updateRouteExclusion(spotId, !included)
      spot.value.routeExcluded = !included
      toast.success(included ? '루트 후보에 포함했습니다.' : '루트 후보에서 제외했습니다.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  },
})

// ─ 무드 태그
const allMoodTags = Object.keys(moodTagLabel) as MoodTag[]
const moodDraft = ref<MoodTag[]>([])
const moodSaving = ref(false)
const moodDirty = computed(() => {
  const current = [...(spot.value?.mood?.tags ?? [])].sort().join()
  return [...moodDraft.value].sort().join() !== current
})
function toggleMood(tag: MoodTag) {
  moodDraft.value = moodDraft.value.includes(tag) ? moodDraft.value.filter((t) => t !== tag) : [...moodDraft.value, tag]
}
async function saveMoods() {
  if (moodDraft.value.length === 0) {
    toast.error('무드 태그를 1개 이상 선택하세요.')
    return
  }
  moodSaving.value = true
  try {
    await spotsApi.updateMoods(spotId, moodDraft.value)
    toast.success('무드 태그를 저장했습니다.')
    await load()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    moodSaving.value = false
  }
}

// ─ AI 설명
const descriptionDraft = ref('')
const descriptionSaving = ref(false)
const descriptionDirty = computed(() => descriptionDraft.value !== (spot.value?.description ?? ''))
async function saveDescription() {
  if (!descriptionDraft.value.trim()) {
    toast.error('설명을 입력하세요.')
    return
  }
  descriptionSaving.value = true
  try {
    await spotsApi.updateDescription(spotId, descriptionDraft.value)
    toast.success('설명을 저장했습니다.')
    await load()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    descriptionSaving.value = false
  }
}
</script>

<template>
  <button type="button" class="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900" @click="router.push({ name: 'spots' })">
    <ArrowLeft class="size-4" /> 스팟 목록
  </button>

  <template v-if="spot">
    <PageHeader :title="spot.translation?.title ?? '(제목 없음)'">
      <template #actions>
        <Badge :tone="spotStatusTone[spot.status]">{{ spotStatusLabel[spot.status] }}</Badge>
        <template v-if="spot.status !== 'DELETED'">
          <BaseButton v-if="spot.status === 'HIDDEN'" variant="secondary" @click="openAction('publish')">노출 복구</BaseButton>
          <BaseButton v-else-if="spot.status === 'PUBLISHED'" variant="secondary" @click="openAction('hide')">숨김</BaseButton>
          <BaseButton variant="danger" @click="openAction('delete')">삭제</BaseButton>
        </template>
      </template>
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-3">
      <Card class="lg:row-span-2">
        <div v-if="primaryImage" class="mb-4 overflow-hidden rounded-lg bg-gray-100">
          <img :src="primaryImage.url" :alt="spot.translation?.title ?? ''" class="aspect-[4/3] w-full object-cover" loading="lazy" />
        </div>
        <h2 class="mb-3 text-sm font-semibold">기본 정보</h2>
        <dl class="space-y-2 text-sm">
          <div><dt class="text-xs text-gray-500">스팟 ID · 콘텐츠 ID</dt><dd class="font-mono text-xs">#{{ spot.id }} · {{ spot.contentId }} ({{ spot.source }})</dd></div>
          <div><dt class="text-xs text-gray-500">유형</dt><dd>{{ spotContentTypeLabel[spot.contentType] }}</dd></div>
          <div><dt class="text-xs text-gray-500">주소</dt><dd>{{ [spot.translation?.addr1, spot.translation?.addr2].filter(Boolean).join(' ') || '-' }}</dd></div>
          <div><dt class="text-xs text-gray-500">지역</dt><dd>{{ [spot.area, spot.district, spot.neighborhood].filter(Boolean).join(' ') || '-' }}</dd></div>
          <div>
            <dt class="text-xs text-gray-500">좌표</dt>
            <dd class="flex items-center gap-2">
              <span class="font-mono text-xs">{{ spot.latitude ?? '-' }}, {{ spot.longitude ?? '-' }}</span>
              <a v-if="naverMapUrl" :href="naverMapUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                지도 <ExternalLink class="size-3" />
              </a>
            </dd>
          </div>
          <div><dt class="text-xs text-gray-500">전화</dt><dd>{{ spot.tel ?? '-' }}</dd></div>
          <div>
            <dt class="text-xs text-gray-500">홈페이지</dt>
            <dd class="truncate">
              <a v-if="spot.homepage" :href="spot.homepage" target="_blank" rel="noopener" class="text-blue-600 hover:underline">{{ spot.homepage }}</a>
              <span v-else>-</span>
            </dd>
          </div>
          <div><dt class="text-xs text-gray-500">북마크</dt><dd>{{ formatNumber(spot.bookmarkCount) }}</dd></div>
          <div><dt class="text-xs text-gray-500">수집일 · 갱신일</dt><dd>{{ formatDateTime(spot.createdAt) }} · {{ formatDateTime(spot.updatedAt) }}</dd></div>
        </dl>
        <template v-if="spot.statusChangedAt">
          <h2 class="mt-6 mb-3 text-sm font-semibold">상태 이력</h2>
          <dl class="space-y-2 text-sm">
            <div><dt class="text-xs text-gray-500">변경일</dt><dd>{{ formatDateTime(spot.statusChangedAt) }}</dd></div>
            <div><dt class="text-xs text-gray-500">사유</dt><dd>{{ spot.statusReason ?? '-' }}</dd></div>
          </dl>
        </template>
      </Card>

      <Card class="lg:col-span-2">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold">
            무드 태그
            <span v-if="spot.mood?.confidence != null" class="ml-2 text-xs font-normal text-gray-500">AI 신뢰도 {{ Math.round(spot.mood.confidence * 100) }}%</span>
          </h2>
          <BaseButton :disabled="!moodDirty" :loading="moodSaving" class="!px-3 !py-1" @click="saveMoods">저장</BaseButton>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in allMoodTags"
            :key="tag"
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-medium transition"
            :class="moodDraft.includes(tag)
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
            @click="toggleMood(tag)"
          >
            {{ moodTagLabel[tag] }}
          </button>
        </div>
        <p v-if="!spot.mood" class="mt-3 text-xs text-gray-500">아직 AI 태깅 전입니다. 수동으로 지정하면 바로 반영됩니다.</p>

        <div class="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <div class="text-sm font-semibold">루트 생성 후보</div>
            <div class="text-xs text-gray-500">제외하면 AI 루트 생성 시 이 스팟을 넣지 않습니다.</div>
          </div>
          <Toggle v-model="routeIncluded" :label="routeIncluded ? '포함' : '제외'" :disabled="spot.status === 'DELETED'" />
        </div>
      </Card>

      <Card class="lg:col-span-2">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold">AI 설명</h2>
          <BaseButton :disabled="!descriptionDirty" :loading="descriptionSaving" class="!px-3 !py-1" @click="saveDescription">저장</BaseButton>
        </div>
        <TextArea v-model="descriptionDraft" :rows="6" :maxlength="2000" placeholder="앱에 노출되는 스팟 설명 (2,000자 이내)" />
        <template v-if="spot.translation?.overview">
          <h3 class="mt-4 mb-1 text-xs font-semibold text-gray-500">원본 개요 (TourAPI)</h3>
          <p class="text-sm whitespace-pre-line text-gray-600">{{ spot.translation.overview }}</p>
        </template>
      </Card>
    </div>
  </template>

  <ConfirmDialog
    :open="action !== null"
    :title="action ? actionMeta[action].title : ''"
    :message="action ? actionMeta[action].message : ''"
    :confirm-label="action ? actionMeta[action].confirm : ''"
    :danger="action !== 'publish'"
    :loading="acting"
    @confirm="confirmAction"
    @cancel="action = null"
  >
    <TextArea v-if="action !== 'publish'" v-model="reason" :rows="3" :maxlength="200" placeholder="사유 (200자 이내)" class="mt-3" />
  </ConfirmDialog>
</template>

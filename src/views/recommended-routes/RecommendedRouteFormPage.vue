<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ChevronDown, ChevronUp, ImageOff, Plus, Trash2, X } from 'lucide-vue-next'
import { recommendedRoutesApi } from '@/api/recommended-routes.api'
import { spotsApi } from '@/api/spots.api'
import { useCursorList } from '@/composables/useCursorList'
import { getErrorCode, getErrorMessage } from '@/utils/error'
import { spotContentTypeLabel, spotStatusLabel, spotStatusTone } from '@/utils/labels'
import {
  RECOMMENDED_ROUTE_MAX_DAYS, RECOMMENDED_ROUTE_MAX_SPOTS_PER_DAY, RECOMMENDED_ROUTE_MAX_STOPS,
  type RecommendedRouteRequest, type RecommendedRouteStop,
} from '@/types/curation'
import type { SpotDetail, SpotSummary } from '@/types/spot'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'
import TextInput from '@/components/common/TextInput.vue'
import Toggle from '@/components/common/Toggle.vue'
import DataTable from '@/components/common/DataTable.vue'
import LoadMore from '@/components/common/LoadMore.vue'

/** 루트에 담긴 스팟. 편집 화면에 필요한 만큼만 상세에서 추린다 */
interface RouteSpot {
  id: number
  title: string
  area: string | null
  district: string | null
  contentType: SpotDetail['contentType']
  status: SpotDetail['status']
  images: SpotDetail['images']
}

const route = useRoute()
const router = useRouter()
const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => id.value !== null)

const form = reactive({ title: '', imageUrl: '', region: '', visible: true })
/** 일차별 스팟 목록. 서버 stops(day·sequence)와 배열 인덱스로 1:1 */
const days = ref<RouteSpot[][]>([[]])
/** 수정 시 기존 순서 유지, 등록 시 목록 끝(현재 개수) */
let sortOrder = 0

const loading = ref(false)
const saving = ref(false)

const totalStops = computed(() => days.value.reduce((n, d) => n + d.length, 0))
const spotIds = computed(() => new Set(days.value.flat().map((s) => s.id)))
const routeImages = computed(() => days.value.flat().flatMap((s) => s.images.map((img) => ({ spotTitle: s.title, url: img.url }))))

function toRouteSpot(detail: SpotDetail): RouteSpot {
  return {
    id: detail.id,
    title: detail.translation?.title ?? `#${detail.id}`,
    area: detail.area,
    district: detail.district,
    contentType: detail.contentType,
    status: detail.status,
    images: detail.images,
  }
}

onMounted(async () => {
  loading.value = true
  try {
    if (!isEdit.value) {
      sortOrder = (await recommendedRoutesApi.list()).length
      return
    }
    const saved = await recommendedRoutesApi.get(id.value!)
    Object.assign(form, { title: saved.title, imageUrl: saved.imageUrl, region: saved.region, visible: saved.visible })
    sortOrder = saved.sortOrder
    days.value = await buildDays(saved.stops)
  } catch (error) {
    toast.error(getErrorMessage(error))
    router.replace({ name: 'recommended-routes' })
  } finally {
    loading.value = false
  }
})

/** 목록·상세 응답에는 spotId만 있어 스팟 상세를 따로 읽는다 (최대 30건, 병렬) */
async function buildDays(stops: RecommendedRouteStop[]): Promise<RouteSpot[][]> {
  const details = await Promise.all(stops.map((s) => spotsApi.get(s.spotId)))
  const byId = new Map(details.map((d) => [d.id, toRouteSpot(d)]))
  const dayCount = Math.max(...stops.map((s) => s.day), 1)
  return Array.from({ length: dayCount }, (_, i) =>
    stops.filter((s) => s.day === i + 1).sort((a, b) => a.sequence - b.sequence).map((s) => byId.get(s.spotId)!),
  )
}

// ── 일차 ──
function addDay() {
  if (days.value.length >= RECOMMENDED_ROUTE_MAX_DAYS) return
  days.value.push([])
}
function removeDay(index: number) {
  if (days.value.length <= 1) return
  days.value.splice(index, 1)
}

// ── 스팟 순서 ──
function moveSpot(dayIndex: number, index: number, dir: -1 | 1) {
  const day = days.value[dayIndex]!
  const target = index + dir
  if (target < 0 || target >= day.length) return
  ;[day[index], day[target]] = [day[target]!, day[index]!]
}
function removeSpot(dayIndex: number, index: number) {
  days.value[dayIndex]!.splice(index, 1)
}

// ── 스팟 검색 모달 ──
const picker = reactive({ open: false, dayIndex: 0, keyword: '', area: '' })
const adding = ref<number | null>(null)
/** 앱은 PUBLISHED 스팟만 루트에 실으므로 검색도 그것만 */
const search = useCursorList<SpotSummary>((cursor) =>
  spotsApi.list({ keyword: picker.keyword || undefined, area: picker.area || undefined, status: 'PUBLISHED', cursor, size: 20 }),
)
function openPicker(dayIndex: number) {
  picker.dayIndex = dayIndex
  picker.open = true
  if (search.items.value.length === 0) search.reload()
}
function canAdd(spot: SpotSummary) {
  const day = days.value[picker.dayIndex]!
  return !spotIds.value.has(spot.id) && day.length < RECOMMENDED_ROUTE_MAX_SPOTS_PER_DAY && totalStops.value < RECOMMENDED_ROUTE_MAX_STOPS
}
async function addSpot(spot: SpotSummary) {
  if (!canAdd(spot)) return
  adding.value = spot.id
  try {
    // 대표 이미지 선택에 이미지 목록이 필요해 상세를 읽어 담는다
    days.value[picker.dayIndex]!.push(toRouteSpot(await spotsApi.get(spot.id)))
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    adding.value = null
  }
}
const searchColumns = [
  { key: 'title', label: '스팟' },
  { key: 'contentType', label: '유형', class: 'w-24' },
  { key: 'location', label: '지역', class: 'w-36' },
  { key: 'action', label: '', class: 'w-20 text-right' },
]

// ── 대표 이미지 ──
const imagePicker = ref(false)

// ── 저장 ──
function toStops(): RecommendedRouteStop[] {
  return days.value.flatMap((day, d) => day.map((spot, s) => ({ spotId: spot.id, day: d + 1, sequence: s + 1 })))
}
function validate(): string | null {
  if (days.value.some((d) => d.length === 0)) return '비어 있는 일차가 있습니다. 스팟을 담거나 일차를 삭제하세요.'
  if (totalStops.value === 0) return '스팟을 1개 이상 담아야 합니다.'
  if (!/^https?:\/\/\S+$/.test(form.imageUrl)) return '대표 이미지는 http(s) URL이어야 합니다.'
  return null
}
async function submit() {
  const problem = validate()
  if (problem) {
    toast.error(problem)
    return
  }
  const body: RecommendedRouteRequest = { ...form, sortOrder, stops: toStops() }
  saving.value = true
  try {
    if (isEdit.value) {
      await recommendedRoutesApi.update(id.value!, body)
      toast.success('추천 루트를 수정했습니다.')
    } else {
      await recommendedRoutesApi.create(body)
      toast.success('추천 루트를 등록했습니다.')
    }
    router.push({ name: 'recommended-routes' })
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'SPOT_NOT_AVAILABLE') toast.error('노출 중(PUBLISHED)인 스팟만 담을 수 있습니다. 상태가 바뀐 스팟을 교체하세요.')
    else toast.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageHeader :title="isEdit ? '추천 루트 수정' : '추천 루트 등록'" />

  <div v-if="loading" class="text-sm text-gray-500">불러오는 중…</div>
  <form v-else class="max-w-4xl space-y-6" @submit.prevent="submit">
    <Card class="space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <FormField label="제목" required hint="100자">
          <TextInput v-model="form.title" required :maxlength="100" />
        </FormField>
        <FormField label="지역" required hint="카드에 표시할 지역명 (100자)">
          <TextInput v-model="form.region" required :maxlength="100" placeholder="예) 서울, 제주" />
        </FormField>
      </div>
      <FormField label="대표 이미지 URL" required hint="http(s) URL. 담은 스팟의 이미지에서 고를 수도 있습니다">
        <div class="flex gap-3">
          <div class="size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
            <img v-if="form.imageUrl" :src="form.imageUrl" alt="" class="size-full object-cover" />
            <div v-else class="flex size-full items-center justify-center text-gray-300"><ImageOff class="size-5" /></div>
          </div>
          <div class="flex flex-1 flex-col gap-2">
            <TextInput v-model="form.imageUrl" required :maxlength="2000" placeholder="https://" />
            <div>
              <BaseButton variant="secondary" class="!px-3 !py-1" :disabled="routeImages.length === 0" @click="imagePicker = true">
                스팟 이미지에서 선택
              </BaseButton>
            </div>
          </div>
        </div>
      </FormField>
      <Toggle v-model="form.visible" label="앱에 노출" />
    </Card>

    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold">
        일정
        <span class="ml-2 text-xs font-normal text-gray-400">
          {{ days.length }}일 · 스팟 {{ totalStops }}/{{ RECOMMENDED_ROUTE_MAX_STOPS }} · 일차당 최대 {{ RECOMMENDED_ROUTE_MAX_SPOTS_PER_DAY }}개
        </span>
      </h2>
      <BaseButton variant="secondary" class="!px-3 !py-1" :disabled="days.length >= RECOMMENDED_ROUTE_MAX_DAYS" @click="addDay">
        일차 추가
      </BaseButton>
    </div>

    <Card v-for="(day, di) in days" :key="di" class="!p-0">
      <div class="flex items-center gap-3 px-5 py-3">
        <span class="font-semibold">Day {{ di + 1 }}</span>
        <span class="text-xs text-gray-400">{{ day.length }}개</span>
        <div class="ml-auto flex items-center gap-1">
          <button
            type="button"
            class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            :disabled="day.length >= RECOMMENDED_ROUTE_MAX_SPOTS_PER_DAY || totalStops >= RECOMMENDED_ROUTE_MAX_STOPS"
            @click="openPicker(di)"
          ><Plus class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30" :disabled="days.length <= 1" @click="removeDay(di)"><Trash2 class="size-4" /></button>
        </div>
      </div>
      <ul class="divide-y divide-gray-100 border-t border-gray-200">
        <li v-if="day.length === 0" class="px-5 py-4 text-sm text-gray-400">스팟이 없습니다. + 버튼으로 담으세요.</li>
        <li v-for="(spot, si) in day" :key="spot.id" class="flex items-center gap-3 px-5 py-3">
          <span class="w-5 text-center font-mono text-xs text-gray-400">{{ si + 1 }}</span>
          <div class="size-10 shrink-0 overflow-hidden rounded bg-gray-100">
            <img v-if="spot.images[0]" :src="spot.images[0].url" alt="" class="size-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-medium">{{ spot.title }}</span>
              <Badge v-if="spot.status !== 'PUBLISHED'" :tone="spotStatusTone[spot.status]">{{ spotStatusLabel[spot.status] }}</Badge>
            </div>
            <p class="text-xs text-gray-500">{{ spotContentTypeLabel[spot.contentType] }} · {{ [spot.area, spot.district].filter(Boolean).join(' ') || '-' }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="si === 0" @click="moveSpot(di, si, -1)"><ChevronUp class="size-4" /></button>
            <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="si === day.length - 1" @click="moveSpot(di, si, 1)"><ChevronDown class="size-4" /></button>
            <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100" @click="removeSpot(di, si)"><X class="size-4" /></button>
          </div>
        </li>
      </ul>
    </Card>

    <div class="flex justify-end gap-2">
      <BaseButton variant="secondary" @click="router.push({ name: 'recommended-routes' })">취소</BaseButton>
      <BaseButton type="submit" :loading="saving">{{ isEdit ? '수정' : '등록' }}</BaseButton>
    </div>
  </form>

  <BaseModal :open="picker.open" :title="`Day ${picker.dayIndex + 1}에 스팟 담기`" wide @close="picker.open = false">
    <form class="mb-3 flex gap-2" @submit.prevent="search.reload">
      <TextInput v-model="picker.keyword" placeholder="제목 · 콘텐츠 ID 검색" class="!w-64" />
      <TextInput v-model="picker.area" placeholder="지역 (예: 서울)" class="!w-36" />
      <button type="submit" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">검색</button>
      <Badge tone="green" class="self-center">노출 중 스팟만</Badge>
    </form>
    <div class="max-h-[50vh] overflow-y-auto">
      <DataTable :columns="searchColumns" :rows="search.items.value" :row-key="(r) => r.id" :loading="search.loading.value">
        <template #title="{ row }">
          <span :class="spotIds.has(row.id) ? 'text-gray-400' : ''">{{ row.title ?? `#${row.id}` }}</span>
        </template>
        <template #contentType="{ row }">{{ spotContentTypeLabel[row.contentType] }}</template>
        <template #location="{ row }">{{ [row.area, row.district].filter(Boolean).join(' ') || '-' }}</template>
        <template #action="{ row }">
          <div class="flex justify-end">
            <Badge v-if="spotIds.has(row.id)" tone="gray">담김</Badge>
            <BaseButton v-else variant="secondary" class="!px-3 !py-1" :disabled="!canAdd(row)" :loading="adding === row.id" @click="addSpot(row)">담기</BaseButton>
          </div>
        </template>
      </DataTable>
      <LoadMore :has-next="search.hasNext.value" :loading="search.loading.value" @more="search.loadMore" />
    </div>
    <template #footer>
      <BaseButton variant="secondary" @click="picker.open = false">닫기</BaseButton>
    </template>
  </BaseModal>

  <BaseModal :open="imagePicker" title="대표 이미지 선택" wide @close="imagePicker = false">
    <div class="grid max-h-[60vh] grid-cols-4 gap-3 overflow-y-auto">
      <button
        v-for="(img, i) in routeImages"
        :key="i"
        type="button"
        class="overflow-hidden rounded-lg border-2 text-left"
        :class="form.imageUrl === img.url ? 'border-gray-900' : 'border-transparent hover:border-gray-300'"
        @click="form.imageUrl = img.url; imagePicker = false"
      >
        <img :src="img.url" alt="" class="aspect-square w-full object-cover" />
        <p class="truncate px-2 py-1 text-xs text-gray-500">{{ img.spotTitle }}</p>
      </button>
    </div>
    <template #footer>
      <BaseButton variant="secondary" @click="imagePicker = false">닫기</BaseButton>
    </template>
  </BaseModal>
</template>

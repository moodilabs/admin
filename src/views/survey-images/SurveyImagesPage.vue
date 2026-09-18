<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { ChevronDown, ChevronUp, Pencil, Trash2, ImageOff } from 'lucide-vue-next'
import { surveyImagesApi } from '@/api/survey-images.api'
import { spotsApi } from '@/api/spots.api'
import { useCursorList } from '@/composables/useCursorList'
import { getErrorCode, getErrorMessage } from '@/utils/error'
import { moodTagLabel, spotContentTypeLabel, toOptions } from '@/utils/labels'
import type { SurveyImage, SurveyImageRequest } from '@/types/curation'
import type { MoodTag, SpotDetail, SpotSummary } from '@/types/spot'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import FormField from '@/components/common/FormField.vue'
import TextInput from '@/components/common/TextInput.vue'
import SelectField from '@/components/common/SelectField.vue'
import DataTable from '@/components/common/DataTable.vue'
import LoadMore from '@/components/common/LoadMore.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const ALL_MOODS = Object.keys(moodTagLabel) as MoodTag[]

const images = ref<SurveyImage[]>([])
/** 응답에 spotId만 있어 제목 표시용으로 상세를 따로 읽어 캐시한다 */
const spotTitles = reactive(new Map<number, string>())
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    images.value = await surveyImagesApi.list()
    await loadSpotTitles(images.value.map((i) => i.spotId))
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
async function loadSpotTitles(spotIds: number[]) {
  const missing = [...new Set(spotIds)].filter((id) => !spotTitles.has(id))
  const details = await Promise.all(missing.map((id) => spotsApi.get(id).catch(() => null)))
  details.forEach((d, i) => spotTitles.set(missing[i]!, d?.translation?.title ?? `#${missing[i]}`))
}
onMounted(load)

/** 무드 20종 중 이미지가 하나도 없는 무드 — 사전조사 화면에서 그 무드는 고를 수 없다 */
const missingMoods = computed(() => {
  const covered = new Set(images.value.map((i) => i.mood))
  return ALL_MOODS.filter((m) => !covered.has(m))
})

async function run(action: () => Promise<unknown>, successMessage: string) {
  try {
    await action()
    toast.success(successMessage)
    await load()
    return true
  } catch (error) {
    if (getErrorCode(error) === 'SPOT_NOT_AVAILABLE') {
      toast.error('노출 중인 스팟에 등록된 이미지만 쓸 수 있습니다. 스팟이나 이미지를 다시 고르세요.')
    } else {
      toast.error(getErrorMessage(error))
    }
    return false
  }
}

// ── 순서 이동 (전체 ID 배열을 sort_order=index 로 교체) ──
function move(index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= images.value.length) return
  const ids = images.value.map((i) => i.id)
  ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
  run(() => surveyImagesApi.reorder(ids), '노출 순서를 변경했습니다.')
}

// ── 등록/수정 모달: 무드 선택 → 스팟 검색·선택 → 그 스팟의 이미지에서 선택 ──
const modal = reactive<{ open: boolean; id: number | null; form: SurveyImageRequest }>({
  open: false, id: null, form: { mood: 'NATURE', spotId: 0, imageUrl: '', sortOrder: 0 },
})
const saving = ref(false)
/** 선택된 스팟 상세 — 이미지 후보의 출처 */
const spot = ref<SpotDetail | null>(null)
const spotLoading = ref(false)

const search = reactive({ keyword: '', area: '' })
const results = useCursorList<SpotSummary>((cursor) =>
  spotsApi.list({ keyword: search.keyword || undefined, area: search.area || undefined, status: 'PUBLISHED', cursor, size: 20 }),
)
const searchColumns = [
  { key: 'title', label: '스팟' },
  { key: 'contentType', label: '유형', class: 'w-24' },
  { key: 'location', label: '지역', class: 'w-36' },
  { key: 'action', label: '', class: 'w-20 text-right' },
]

async function openModal(image?: SurveyImage) {
  modal.id = image?.id ?? null
  modal.form = image
    ? { mood: image.mood, spotId: image.spotId, imageUrl: image.imageUrl, sortOrder: image.sortOrder }
    : { mood: missingMoods.value[0] ?? 'NATURE', spotId: 0, imageUrl: '', sortOrder: images.value.length }
  spot.value = null
  modal.open = true
  if (results.items.value.length === 0) results.reload()
  if (image) await selectSpot(image.spotId)
}

async function selectSpot(spotId: number) {
  spotLoading.value = true
  try {
    spot.value = await spotsApi.get(spotId)
    modal.form.spotId = spotId
    // 스팟이 바뀌면 이전 스팟의 이미지는 더 이상 유효하지 않다
    if (!spot.value.images.some((img) => img.url === modal.form.imageUrl)) modal.form.imageUrl = ''
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    spotLoading.value = false
  }
}

async function submit() {
  if (!modal.form.spotId || !modal.form.imageUrl) {
    toast.error('스팟을 고른 뒤 이미지를 선택하세요.')
    return
  }
  saving.value = true
  const body = { ...modal.form }
  const ok = modal.id === null
    ? await run(() => surveyImagesApi.create(body), '사전조사 이미지를 등록했습니다.')
    : await run(() => surveyImagesApi.update(modal.id!, body), '사전조사 이미지를 수정했습니다.')
  saving.value = false
  if (ok) modal.open = false
}

// ── 삭제 ──
const deleteTarget = ref<SurveyImage | null>(null)
const deleting = ref(false)
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const ok = await run(() => surveyImagesApi.remove(deleteTarget.value!.id), '사전조사 이미지를 삭제했습니다.')
  deleting.value = false
  if (ok) deleteTarget.value = null
}
</script>

<template>
  <PageHeader title="사전조사 이미지">
    <template #actions>
      <BaseButton @click="openModal()">이미지 추가</BaseButton>
    </template>
  </PageHeader>

  <p class="mb-2 text-sm text-gray-500">
    회원가입 사전조사에서 사용자가 고르는 무드 대표 이미지입니다. 무드별로 스팟을 정하고 그 스팟에 등록된 이미지 중 하나를 선택합니다.
  </p>
  <div v-if="!loading" class="mb-4 flex flex-wrap items-center gap-1 text-xs">
    <span class="mr-1 text-gray-500">무드 {{ ALL_MOODS.length }}종 중 {{ ALL_MOODS.length - missingMoods.length }}종 등록</span>
    <template v-if="missingMoods.length > 0">
      <span class="text-gray-400">· 미등록:</span>
      <Badge v-for="mood in missingMoods" :key="mood" tone="yellow">{{ moodTagLabel[mood] }}</Badge>
    </template>
  </div>

  <div v-if="loading && images.length === 0" class="text-sm text-gray-500">불러오는 중…</div>
  <EmptyState v-else-if="images.length === 0" message="등록된 사전조사 이미지가 없습니다." />

  <Card v-else class="!p-0">
    <ul class="divide-y divide-gray-100">
      <li v-for="(image, index) in images" :key="image.id" class="flex items-center gap-4 px-5 py-3">
        <span class="w-6 text-center font-mono text-xs text-gray-500">{{ index + 1 }}</span>
        <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <img :src="image.imageUrl" alt="" class="size-full object-cover" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <Badge tone="blue">{{ moodTagLabel[image.mood] }}</Badge>
            <span class="truncate text-sm font-medium">{{ spotTitles.get(image.spotId) ?? `#${image.spotId}` }}</span>
          </div>
          <p class="mt-0.5 truncate text-xs text-gray-400">{{ image.imageUrl }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="index === 0" @click="move(index, -1)"><ChevronUp class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="index === images.length - 1" @click="move(index, 1)"><ChevronDown class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100" @click="openModal(image)"><Pencil class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-red-500 hover:bg-red-50" @click="deleteTarget = image"><Trash2 class="size-4" /></button>
        </div>
      </li>
    </ul>
  </Card>

  <BaseModal :open="modal.open" :title="modal.id === null ? '사전조사 이미지 추가' : '사전조사 이미지 수정'" wide @close="modal.open = false">
    <form id="survey-image-form" class="space-y-5" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-4">
        <FormField label="무드" required>
          <SelectField v-model="modal.form.mood" :options="toOptions(moodTagLabel)" class="w-full" />
        </FormField>
        <FormField label="선택된 스팟" required>
          <div class="flex h-[38px] items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm" :class="spot ? '' : 'text-gray-400'">
            <span v-if="spotLoading">불러오는 중…</span>
            <span v-else-if="spot" class="truncate">{{ spot.translation?.title ?? `#${spot.id}` }} <span class="text-xs text-gray-400">· {{ [spot.area, spot.district].filter(Boolean).join(' ') }}</span></span>
            <span v-else>아래에서 스팟을 고르세요</span>
          </div>
        </FormField>
      </div>

      <FormField label="스팟 검색" hint="노출 중(PUBLISHED) 스팟만">
        <div class="mb-2 flex gap-2">
          <TextInput v-model="search.keyword" placeholder="제목 · 콘텐츠 ID" class="!w-56" @keydown.enter.prevent="results.reload" />
          <TextInput v-model="search.area" placeholder="지역" class="!w-32" @keydown.enter.prevent="results.reload" />
          <BaseButton variant="secondary" class="!py-1" @click="results.reload">검색</BaseButton>
        </div>
        <div class="max-h-56 overflow-y-auto">
          <DataTable :columns="searchColumns" :rows="results.items.value" :row-key="(r) => r.id" :loading="results.loading.value">
            <template #title="{ row }">{{ row.title ?? `#${row.id}` }}</template>
            <template #contentType="{ row }">{{ spotContentTypeLabel[row.contentType] }}</template>
            <template #location="{ row }">{{ [row.area, row.district].filter(Boolean).join(' ') || '-' }}</template>
            <template #action="{ row }">
              <div class="flex justify-end">
                <Badge v-if="modal.form.spotId === row.id" tone="green">선택됨</Badge>
                <BaseButton v-else variant="secondary" class="!px-3 !py-1" @click="selectSpot(row.id)">선택</BaseButton>
              </div>
            </template>
          </DataTable>
          <LoadMore :has-next="results.hasNext.value" :loading="results.loading.value" @more="results.loadMore" />
        </div>
      </FormField>

      <FormField label="이미지" required hint="선택한 스팟에 등록된 이미지만 쓸 수 있습니다">
        <div v-if="!spot" class="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">스팟을 먼저 고르세요.</div>
        <div v-else-if="spot.images.length === 0" class="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-400">
          <ImageOff class="size-4" /> 이 스팟에는 이미지가 없습니다. 다른 스팟을 고르세요.
        </div>
        <div v-else class="grid grid-cols-5 gap-2">
          <button
            v-for="img in spot.images"
            :key="img.url"
            type="button"
            class="overflow-hidden rounded-lg border-2"
            :class="modal.form.imageUrl === img.url ? 'border-gray-900' : 'border-transparent hover:border-gray-300'"
            @click="modal.form.imageUrl = img.url"
          >
            <img :src="img.url" alt="" class="aspect-square w-full object-cover" />
          </button>
        </div>
      </FormField>
    </form>
    <template #footer>
      <BaseButton variant="secondary" @click="modal.open = false">취소</BaseButton>
      <BaseButton type="submit" form="survey-image-form" :loading="saving" :disabled="!modal.form.spotId || !modal.form.imageUrl">저장</BaseButton>
    </template>
  </BaseModal>

  <ConfirmDialog
    :open="deleteTarget !== null"
    title="사전조사 이미지 삭제"
    :message="`'${deleteTarget ? moodTagLabel[deleteTarget.mood] : ''}' 무드의 이미지를 사전조사에서 뺍니다. 원본 스팟 이미지는 지워지지 않습니다.`"
    confirm-label="삭제"
    danger
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="deleteTarget = null"
  />
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { ChevronDown, ChevronUp, Pencil, Trash2, Search } from 'lucide-vue-next'
import { recommendedAreasApi } from '@/api/recommended-areas.api'
import { getErrorCode, getErrorMessage } from '@/utils/error'
import { areaLevelLabel, areaLevelTone } from '@/utils/labels'
import type { AreaSuggestion, RecommendedArea, RecommendedAreaRequest } from '@/types/curation'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import FormField from '@/components/common/FormField.vue'
import TextInput from '@/components/common/TextInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'

/** 앱 DSC-04 인기 지역 섹션이 보여주는 최대 개수 — 넘겨도 등록은 되지만 뒤쪽은 앱에 안 보인다 */
const APP_VISIBLE_LIMIT = 5
const SUGGEST_DEBOUNCE_MS = 250

const areas = ref<RecommendedArea[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    areas.value = await recommendedAreasApi.list()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function run(action: () => Promise<unknown>, successMessage: string) {
  try {
    await action()
    toast.success(successMessage)
    await load()
    return true
  } catch (error) {
    if (getErrorCode(error) === 'INVALID_REQUEST') {
      toast.error('자동완성 목록에 있는 지역만 등록할 수 있습니다.')
    } else {
      toast.error(getErrorMessage(error))
    }
    return false
  }
}

// ── 순서 이동 (전체 ID 배열을 sort_order=index 로 교체) ──
function move(index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= areas.value.length) return
  const ids = areas.value.map((a) => a.id)
  ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
  run(() => recommendedAreasApi.reorder(ids), '노출 순서를 변경했습니다.')
}

// ── 등록/수정 모달 ──
function emptyForm(): RecommendedAreaRequest {
  return { level: 'REGION', region: '', district: null, neighborhood: null, label: '', sortOrder: 0 }
}
const modal = reactive<{ open: boolean; id: number | null; form: RecommendedAreaRequest }>({
  open: false, id: null, form: emptyForm(),
})
const saving = ref(false)
/** 자동완성에서 고른 지역. 자유 입력을 막기 위해 이게 없으면 저장 불가 */
const picked = ref<AreaSuggestion | null>(null)
/** 직전 선택의 서버 라벨 — 운영자가 표시 이름을 손대지 않았는지 판단하는 기준 */
let lastPickedLabel = ''

function openModal(area?: RecommendedArea) {
  modal.id = area?.id ?? null
  modal.form = area
    ? { level: area.level, region: area.region, district: area.district, neighborhood: area.neighborhood, label: area.label, sortOrder: area.sortOrder }
    : { ...emptyForm(), sortOrder: areas.value.length }
  picked.value = area ? { ...area } : null
  keyword.value = ''
  suggestions.value = []
  modal.open = true
}

function pick(suggestion: AreaSuggestion) {
  picked.value = suggestion
  Object.assign(modal.form, {
    level: suggestion.level,
    region: suggestion.region,
    district: suggestion.district,
    neighborhood: suggestion.neighborhood,
  })
  // 표시 이름을 아직 안 적었거나 이전 선택값 그대로면 서버 라벨로 채운다
  if (!modal.form.label || modal.form.label === lastPickedLabel) modal.form.label = suggestion.label
  lastPickedLabel = suggestion.label
  suggestions.value = []
  keyword.value = ''
}

async function submit() {
  if (!picked.value) {
    toast.error('지역을 검색해서 선택하세요.')
    return
  }
  saving.value = true
  const body = { ...modal.form }
  const ok = modal.id === null
    ? await run(() => recommendedAreasApi.create(body), '추천 지역을 등록했습니다.')
    : await run(() => recommendedAreasApi.update(modal.id!, body), '추천 지역을 수정했습니다.')
  saving.value = false
  if (ok) modal.open = false
}

// ── 지역 자동완성 ──
const keyword = ref('')
const suggestions = ref<AreaSuggestion[]>([])
const suggesting = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(keyword, (value) => {
  clearTimeout(debounceTimer)
  if (value.trim().length < 2) {
    suggestions.value = []
    return
  }
  debounceTimer = setTimeout(async () => {
    suggesting.value = true
    try {
      suggestions.value = await recommendedAreasApi.suggest(value.trim())
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      suggesting.value = false
    }
  }, SUGGEST_DEBOUNCE_MS)
})

function areaPath(area: AreaSuggestion) {
  return [area.region, area.district, area.neighborhood].filter(Boolean).join(' › ')
}

// ── 삭제 ──
const deleteTarget = ref<RecommendedArea | null>(null)
const deleting = ref(false)
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const ok = await run(() => recommendedAreasApi.remove(deleteTarget.value!.id), '추천 지역을 삭제했습니다.')
  deleting.value = false
  if (ok) deleteTarget.value = null
}
</script>

<template>
  <PageHeader title="추천 지역">
    <template #actions>
      <BaseButton @click="openModal()">지역 추가</BaseButton>
    </template>
  </PageHeader>

  <p class="mb-4 text-sm text-gray-500">
    스팟 추천 입력 화면의 인기 지역 섹션에 노출됩니다. 앱은 위에서 {{ APP_VISIBLE_LIMIT }}개까지만 보여줍니다.
  </p>

  <div v-if="loading && areas.length === 0" class="text-sm text-gray-500">불러오는 중…</div>
  <EmptyState v-else-if="areas.length === 0" message="등록된 추천 지역이 없습니다." />

  <Card v-else class="!p-0">
    <ul class="divide-y divide-gray-100">
      <li v-for="(area, index) in areas" :key="area.id" class="flex items-center gap-3 px-5 py-3">
        <span class="w-6 text-center font-mono text-xs" :class="index < APP_VISIBLE_LIMIT ? 'text-gray-500' : 'text-gray-300'">{{ index + 1 }}</span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate text-sm font-medium">{{ area.label }}</span>
            <Badge :tone="areaLevelTone[area.level]">{{ areaLevelLabel[area.level] }}</Badge>
            <Badge v-if="index >= APP_VISIBLE_LIMIT" tone="gray">앱 미노출</Badge>
          </div>
          <p class="mt-0.5 text-xs text-gray-500">{{ areaPath(area) }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="index === 0" @click="move(index, -1)"><ChevronUp class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="index === areas.length - 1" @click="move(index, 1)"><ChevronDown class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100" @click="openModal(area)"><Pencil class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-red-500 hover:bg-red-50" @click="deleteTarget = area"><Trash2 class="size-4" /></button>
        </div>
      </li>
    </ul>
  </Card>

  <BaseModal :open="modal.open" :title="modal.id === null ? '추천 지역 추가' : '추천 지역 수정'" @close="modal.open = false">
    <form id="area-form" class="space-y-4" @submit.prevent="submit">
      <FormField label="지역 검색" required hint="스팟이 있는 지역만 검색됩니다 (2자 이상)">
        <div class="relative">
          <div class="relative">
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
            <TextInput v-model="keyword" placeholder="예) 서울, 성수, 제주" class="!pl-9" autocomplete="off" />
          </div>
          <ul
            v-if="suggestions.length > 0"
            class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            <li v-for="(s, i) in suggestions" :key="i">
              <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50" @click="pick(s)">
                <Badge :tone="areaLevelTone[s.level]">{{ areaLevelLabel[s.level] }}</Badge>
                <span class="font-medium">{{ s.label }}</span>
                <span class="ml-auto text-xs text-gray-400">{{ areaPath(s) }}</span>
              </button>
            </li>
          </ul>
          <p v-else-if="keyword.trim().length >= 2 && !suggesting" class="mt-1 text-xs text-gray-400">검색 결과가 없습니다.</p>
        </div>
      </FormField>

      <div class="rounded-lg border px-4 py-3 text-sm" :class="picked ? 'border-gray-200 bg-gray-50' : 'border-dashed border-gray-300 text-gray-400'">
        <template v-if="picked">
          <div class="flex items-center gap-2">
            <Badge :tone="areaLevelTone[picked.level]">{{ areaLevelLabel[picked.level] }}</Badge>
            <span class="font-medium">{{ areaPath(picked) }}</span>
          </div>
        </template>
        <template v-else>선택된 지역이 없습니다. 위에서 검색해 선택하세요.</template>
      </div>

      <FormField label="표시 이름" required hint="앱 칩에 그대로 노출됩니다 (200자)">
        <TextInput v-model="modal.form.label" required :maxlength="200" />
      </FormField>
    </form>
    <template #footer>
      <BaseButton variant="secondary" @click="modal.open = false">취소</BaseButton>
      <BaseButton type="submit" form="area-form" :loading="saving" :disabled="!picked">저장</BaseButton>
    </template>
  </BaseModal>

  <ConfirmDialog
    :open="deleteTarget !== null"
    title="추천 지역 삭제"
    :message="`'${deleteTarget?.label}' 지역을 추천 목록에서 삭제합니다.`"
    confirm-label="삭제"
    danger
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="deleteTarget = null"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { policiesApi } from '@/api/policies.api'
import { getErrorCode, getErrorMessage } from '@/utils/error'
import { toDateInput } from '@/utils/format'
import { policyLocaleLabel, policyTypeLabel, toOptions } from '@/utils/labels'
import type { PolicyRequest } from '@/types/support'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FormField from '@/components/common/FormField.vue'
import TextInput from '@/components/common/TextInput.vue'
import TextArea from '@/components/common/TextArea.vue'
import SelectField from '@/components/common/SelectField.vue'
import Toggle from '@/components/common/Toggle.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => id.value !== null)

const form = reactive<PolicyRequest>({
  type: 'TERMS_OF_SERVICE', version: '', content: '', effectiveAt: toDateInput(), locale: 'en-US', enabled: true, visible: true,
})
const loading = ref(false)
const saving = ref(false)
/** 시행된 버전은 읽기 전용 */
const readonly = ref(false)

onMounted(async () => {
  // 시행된 버전에서 "이 내용으로 새 버전" — 유형·언어·전문만 복사
  const from = typeof route.query.from === 'string' ? Number(route.query.from) : null
  if (!isEdit.value && from) {
    loading.value = true
    try {
      const source = await policiesApi.get(from)
      form.type = source.type
      form.locale = source.locale
      form.content = source.content
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      loading.value = false
    }
    return
  }
  if (!isEdit.value) return
  loading.value = true
  try {
    const policy = await policiesApi.get(id.value!)
    Object.assign(form, {
      type: policy.type,
      version: policy.version,
      content: policy.content,
      effectiveAt: policy.effectiveAt.slice(0, 10),
      locale: policy.locale,
      enabled: policy.enabled,
      visible: policy.visible,
    })
    readonly.value = policy.agreed
  } catch (error) {
    toast.error(getErrorMessage(error))
    router.replace({ name: 'policies' })
  } finally {
    loading.value = false
  }
})

async function submit() {
  saving.value = true
  try {
    if (isEdit.value) {
      await policiesApi.update(id.value!, { ...form })
      toast.success('약관을 수정했습니다.')
    } else {
      await policiesApi.create({ ...form })
      toast.success('약관 버전을 등록했습니다.')
    }
    router.push({ name: 'policies' })
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'POLICY_VERSION_DUPLICATE') toast.error('같은 약관·언어에 이미 존재하는 버전입니다.')
    else if (code === 'POLICY_ALREADY_AGREED') toast.error('회원이 이미 동의한 약관은 수정할 수 없습니다. 새 버전으로 등록하세요.')
    else toast.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

function copyAsNew() {
  router.push({ name: 'policy-new', query: { from: id.value } })
}
</script>

<template>
  <PageHeader :title="isEdit ? (readonly ? '약관 전문' : '약관 수정') : '약관 등록'">
    <template v-if="readonly" #actions>
      <Badge tone="green">시행 중 · 읽기 전용</Badge>
      <BaseButton variant="secondary" @click="copyAsNew">이 내용으로 새 버전</BaseButton>
    </template>
  </PageHeader>

  <Card class="max-w-3xl">
    <form v-if="!loading" class="space-y-5" @submit.prevent="submit">
      <div class="grid grid-cols-4 gap-4">
        <FormField label="약관" required>
          <SelectField v-model="form.type" :options="toOptions(policyTypeLabel)" :disabled="readonly" class="w-full" />
        </FormField>
        <FormField label="언어" required hint="같은 버전을 국문·영문 각각 등록">
          <SelectField v-model="form.locale" :options="toOptions(policyLocaleLabel)" :disabled="readonly" class="w-full" />
        </FormField>
        <FormField label="버전" required hint="예) 1.0, 1.1">
          <TextInput v-model="form.version" required :maxlength="20" :disabled="readonly" />
        </FormField>
        <FormField label="시행일" required hint="오늘 이후로 지정">
          <TextInput v-model="form.effectiveAt" type="date" required :disabled="readonly" />
        </FormField>
      </div>
      <div class="flex gap-8">
        <Toggle v-model="form.enabled" label="시행 활성" :disabled="readonly" />
        <Toggle v-model="form.visible" label="앱 약관보기에 공개" :disabled="readonly" />
        <span v-if="readonly" class="text-xs text-gray-400">회원이 동의한 버전의 시행·공개 상태는 목록에서 변경합니다.</span>
      </div>
      <FormField label="전문" required>
        <TextArea v-model="form.content" required :rows="24" :disabled="readonly" />
      </FormField>
      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="secondary" @click="router.back()">{{ readonly ? '목록으로' : '취소' }}</BaseButton>
        <BaseButton v-if="!readonly" type="submit" :loading="saving">{{ isEdit ? '수정' : '등록' }}</BaseButton>
      </div>
    </form>
    <div v-else class="text-sm text-gray-500">불러오는 중…</div>
  </Card>
</template>

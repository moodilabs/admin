<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Heading2, Heading3, Highlighter, RemoveFormatting } from 'lucide-vue-next'

/**
 * 약관 전문 편집기. HTML을 v-model로 주고받는다.
 * 허용 서식은 백엔드 jsoup 화이트리스트(p/br/strong/em/u/s/h1~h3/ul/ol/li/span[color]/mark[background-color]/a)와 맞춘다 —
 * 여기서 만들 수 없는 태그는 서버에서도 제거된다.
 */
const props = withDefaults(defineProps<{ disabled?: boolean; minRows?: number }>(), { minRows: 24 })
const model = defineModel<string>({ default: '' })

/** 예전 등록분은 태그 없는 평문 — 줄바꿈을 문단으로 바꿔 편집기에 올린다. */
function toEditorHtml(value: string): string {
  if (!value) return ''
  if (/<[a-z][\s\S]*>/i.test(value)) return value
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
    .join('')
}

const editor = useEditor({
  content: toEditorHtml(model.value),
  editable: !props.disabled,
  extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), TextStyle, Color, Highlight.configure({ multicolor: true })],
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none min-h-[var(--min-h)] px-3 py-2 text-sm focus:outline-none',
      style: `--min-h: ${props.minRows * 1.5}rem`,
    },
  },
  onUpdate: ({ editor }) => {
    model.value = editor.isEmpty ? '' : editor.getHTML()
  },
})

watch(
  () => model.value,
  (value) => {
    const current = editor.value
    if (!current || current.getHTML() === value) return
    current.commands.setContent(toEditorHtml(value), { emitUpdate: false })
  },
)
watch(
  () => props.disabled,
  (disabled) => editor.value?.setEditable(!disabled),
)
onBeforeUnmount(() => editor.value?.destroy())

const COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed']

function setColor(color: string) {
  editor.value?.chain().focus().setColor(color).run()
}

/** 형광펜 — 같은 색을 다시 누르면 해제 */
const HIGHLIGHTS = ['#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8']

function toggleHighlight(color: string) {
  editor.value?.chain().focus().toggleHighlight({ color }).run()
}
</script>

<template>
  <div
    class="rounded-lg border border-gray-300 focus-within:border-gray-900"
    :class="disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'"
  >
    <div v-if="editor && !disabled" class="flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1">
      <button type="button" class="tb" :class="{ on: editor.isActive('bold') }" title="굵게" @click="editor.chain().focus().toggleBold().run()"><Bold class="h-4 w-4" /></button>
      <button type="button" class="tb" :class="{ on: editor.isActive('italic') }" title="기울임" @click="editor.chain().focus().toggleItalic().run()"><Italic class="h-4 w-4" /></button>
      <button type="button" class="tb" :class="{ on: editor.isActive('underline') }" title="밑줄" @click="editor.chain().focus().toggleUnderline().run()"><Underline class="h-4 w-4" /></button>
      <button type="button" class="tb" :class="{ on: editor.isActive('strike') }" title="취소선" @click="editor.chain().focus().toggleStrike().run()"><Strikethrough class="h-4 w-4" /></button>
      <span class="mx-1 h-5 w-px bg-gray-200" />
      <button type="button" class="tb" :class="{ on: editor.isActive('heading', { level: 2 }) }" title="제목" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"><Heading2 class="h-4 w-4" /></button>
      <button type="button" class="tb" :class="{ on: editor.isActive('heading', { level: 3 }) }" title="소제목" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"><Heading3 class="h-4 w-4" /></button>
      <button type="button" class="tb" :class="{ on: editor.isActive('bulletList') }" title="목록" @click="editor.chain().focus().toggleBulletList().run()"><List class="h-4 w-4" /></button>
      <button type="button" class="tb" :class="{ on: editor.isActive('orderedList') }" title="번호 목록" @click="editor.chain().focus().toggleOrderedList().run()"><ListOrdered class="h-4 w-4" /></button>
      <span class="mx-1 h-5 w-px bg-gray-200" />
      <button
        v-for="color in COLORS"
        :key="color"
        type="button"
        class="h-5 w-5 rounded-full border border-gray-300"
        :class="{ 'ring-2 ring-gray-900 ring-offset-1': editor.isActive('textStyle', { color }) }"
        :style="{ backgroundColor: color }"
        :title="`글자색 ${color}`"
        @click="setColor(color)"
      />
      <span class="mx-1 h-5 w-px bg-gray-200" />
      <Highlighter class="h-4 w-4 text-gray-400" title="형광펜" />
      <button
        v-for="color in HIGHLIGHTS"
        :key="color"
        type="button"
        class="h-5 w-5 rounded border border-gray-300"
        :class="{ 'ring-2 ring-gray-900 ring-offset-1': editor.isActive('highlight', { color }) }"
        :style="{ backgroundColor: color }"
        :title="`형광펜 ${color}`"
        @click="toggleHighlight(color)"
      />
      <button type="button" class="tb" title="서식 지우기" @click="editor.chain().focus().unsetAllMarks().clearNodes().run()"><RemoveFormatting class="h-4 w-4" /></button>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.tb {
  border-radius: 0.375rem;
  padding: 0.25rem;
  color: #4b5563;
}
.tb:hover {
  background: #f3f4f6;
}
.tb.on {
  background: #111827;
  color: #fff;
}
:deep(.ProseMirror p) { margin: 0 0 0.5rem; }
:deep(.ProseMirror h1) { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
:deep(.ProseMirror h2) { font-size: 1.125rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
:deep(.ProseMirror h3) { font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
:deep(.ProseMirror ul) { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.5rem; }
:deep(.ProseMirror ol) { list-style: decimal; padding-left: 1.25rem; margin-bottom: 0.5rem; }
:deep(.ProseMirror mark) { padding: 0 0.1em; border-radius: 0.125rem; }
</style>

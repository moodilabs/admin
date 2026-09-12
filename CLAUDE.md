# Moodi Admin

Moodi 관리자 웹(SPA). 백엔드는 `moodi-api`의 `/api/admin/**`. 기능·API 스펙 정본은 백엔드 레포 `docs/spec/admin.md`.

## 스택
Vue 3 (`<script setup lang="ts">`) · Vite · TypeScript strict · Tailwind CSS 4 · Pinia · vue-router · axios · lucide-vue-next · vue-sonner

## 규칙
- API 호출은 `src/api/*.api.ts` 모듈로만. 컴포넌트에서 axios 직접 호출 금지. 모든 모듈은 `src/api/client.ts` 사용 (baseURL `/api/admin`, 토큰·재발급 처리 포함).
- 백엔드 응답은 `{ data }` 로 감싸져 온다 (`ApiResponse<T>`). 커서 페이징은 `CursorResponse<T>` (`items · nextCursor · hasNext`). 에러는 RFC 9457 `ProblemDetail` + `code` — 메시지는 `getErrorMessage()`, 분기는 `getErrorCode()`.
- 타입은 `src/types/` 에 백엔드 DTO와 1:1로 둔다. 필드명은 백엔드 camelCase 그대로.
- 라우트 메타: `public`(비로그인), `superOnly`(SUPER 역할). 가드는 `router/index.ts`.
- 알림은 `toast` (vue-sonner). alert/confirm 대신 컴포넌트.
- 경로 alias `@` = `src`.
- 커밋: 한국어 + Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
- 브랜치: `main` · `develop` · `feature/ADM-F0x-...`.

## 검증
`npm run build` (vue-tsc 타입 체크 포함) 가 통과해야 한다.

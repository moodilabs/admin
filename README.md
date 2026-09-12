# Moodi Admin

Moodi 관리자 웹. 백엔드 `/api/admin/**`(moodi-api)를 호출하는 SPA.

기능 범위·API 스펙은 백엔드 레포 `docs/spec/admin.md` 가 정본이고, 화면·라우트·연동 규칙은 [`docs/spec/admin-web.md`](./docs/spec/admin-web.md)에 정리한다.

## 스택

Vue 3 · Vite · TypeScript · Tailwind CSS 4 · Pinia · vue-router · axios · lucide-vue-next · vue-sonner

## 시작

```bash
npm install
cp .env.example .env.local   # 필요 시 API 주소 변경
npm run dev                  # http://localhost:5174
```

- `VITE_API_BASE_URL` — 백엔드 오리진. 개발 서버는 `/api` 를 이 주소로 프록시한다.
- `.env.development` 는 `http://localhost:8080`, `.env.production` 은 `https://moodi.kr`.

## 구조

```
src/
├── api/          # axios 클라이언트 + 도메인별 API 모듈 (auth · accounts · dashboard · members · notices · faqs · policies · inquiries)
├── types/        # 백엔드 응답 타입 (ApiResponse · CursorResponse · ProblemDetail …)
├── stores/       # Pinia (auth)
├── router/       # 라우트 + 인증 가드 (public / superOnly)
├── layouts/      # DashboardLayout (사이드바)
├── components/   # common UI
├── views/        # 페이지 (auth · dashboard · members · notices · faqs · policies · inquiries · accounts)
└── utils/        # token · error · format
```

## 인증

- 로그인 → `accessToken`/`refreshToken` 을 localStorage 에 저장, 모든 요청에 `Authorization: Bearer`.
- 401 시 `/auth/reissue` 로 1회 재발급 후 재시도. 실패하면 로그인으로 이동.
- `SUPER` 역할만 관리자 계정 메뉴 노출 (`meta.superOnly`).

## 구현 순서 (백엔드 ADM-F0x 와 맞춤)

| 순서 | 화면 | 백엔드 |
|---|---|---|
| 1 | 로그인 · 관리자 계정 | ADM-F01 |
| 2 | 공지 · FAQ · 약관 | ADM-F02 |
| 3 | 1:1 문의 | ADM-F03 |
| 4 | 회원 관리 · 정지 | ADM-F04 |
| 5 | 대시보드 | ADM-F05 |
| 6 | 스팟 관리 (B) | ADM-F06 |

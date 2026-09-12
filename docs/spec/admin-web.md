# 어드민 웹 (Admin Web) 스펙

기준 문서: `moodi-api/docs/spec/admin.md` (관리자 백엔드 스펙). 어드민 화면설계서(Figma)는 없으므로
백엔드가 제공하는 API와 운영에 필요한 최소 동선을 기준으로 화면을 정의한다.

## 0. 결론 요약

| 항목 | 결정 |
|---|---|
| 형태 | **SPA** (Vue 3 + Vite + TS + Tailwind 4 + Pinia + vue-router + axios). 별도 레포 `moodilabs/admin` |
| 배포 | 정적 빌드(`dist/`)를 Firebase Hosting 별도 사이트 **`admin.moodi.kr`** 에 올리고 `/api/**`를 Cloud Run `moodi-api`로 rewrite (§11) |
| 인증 | 백엔드 관리자 JWT(`type=ADMIN_ACCESS`). 토큰은 `localStorage`. 401 시 `/auth/reissue` 1회 재시도 후 실패면 로그인으로 |
| 권한 | `SUPER` / `OPERATOR`. 라우트 `meta.superOnly` + 버튼 단위 `auth.isSuper` 분기. 서버가 최종 판정(403 → 토스트) |
| 페이징 | 백엔드 `CursorResponse` 그대로. **"더 보기" 버튼** 방식(무한 스크롤·오프셋 페이지 안 씀) |
| 에러 | RFC 9457 `ProblemDetail` + `code`. 메시지는 `detail`을 그대로 토스트, 분기가 필요한 `code`만 화면에서 처리 |
| 다국어·테마 | 없음. 한국어 · 라이트 고정 |
| 반응형 | 데스크톱 우선(≥ 1024px). 태블릿까지만 깨지지 않게, 모바일은 비지원 |
| 상태관리 | 전역은 `auth`(로그인 관리자)만 Pinia. 나머지는 페이지 로컬 `ref` |
| 범위 밖 | 감사 로그 조회 화면(백엔드 §1.5 후순위), 검색 로그/인기 지역(§9), 알림, 다크모드 |

---

## 1. 공통

### 1.1 레이아웃 (ADW-L)

```
┌──────────┬──────────────────────────────────────┐
│ Sidebar  │ Main                                  │
│ 240px    │  PageHeader (제목 · 설명 · 액션 버튼)  │
│          │  필터 바                              │
│ 로고     │  콘텐츠 (DataTable / Card / Form)     │
│ 메뉴 7개 │  LoadMore                             │
│ 계정·로그아웃│                                    │
└──────────┴──────────────────────────────────────┘
```

- 사이드바 메뉴 순서: 대시보드 · 회원 관리 · 공지사항 · FAQ · 약관 관리 · 1:1 문의 · 관리자 계정(SUPER만) · 스팟 관리(§8 구현 후).
- 사이드바 하단: 이름 · 이메일 · 역할 · 로그아웃.
- 문서 제목: `{페이지명} · Moodi Admin` (`router.afterEach`).
- 로그인 페이지는 레이아웃 없이 중앙 카드 하나.

### 1.2 인증 흐름

```
앱 진입 ─▶ router.beforeEach ─▶ auth.restore()
              │  localStorage에 accessToken 있으면 GET /api/admin/me
              │  실패(401/403) → 토큰 삭제, 비로그인 취급
              ├─ meta.public(로그인) + 이미 로그인 → "/"
              ├─ 비로그인 + 보호 라우트 → /login?redirect={fullPath}
              └─ meta.superOnly + OPERATOR → "/"
```

- 로그인 성공: `POST /auth/login` → 토큰 저장 → `GET /me` → `redirect` 쿼리 또는 `/`.
- 요청 인터셉터: `Authorization: Bearer {accessToken}` 자동 첨부.
- 응답 인터셉터(401):
  1. `/auth/*` 요청 자체의 401은 재시도하지 않음(로그인 실패·재발급 실패).
  2. refreshToken 없으면 → 로그인으로.
  3. 재발급 중이면 큐에 대기, 완료 후 새 토큰으로 원 요청 재시도(회전된 refresh 토큰으로 인한 연쇄 실패 방지).
  4. `POST /auth/reissue` 성공 → 토큰 교체·재시도. 실패 → 토큰 삭제·`/login`.
- 로그아웃: `POST /auth/logout` 호출 후(실패해도) 토큰 삭제·`/login`.
- 액세스 30분·리프레시 12시간(백엔드 §1.2)이라 12시간 지나면 재로그인. 별도 "세션 만료" 안내 없이 로그인 화면으로 보낸다.

### 1.3 에러 처리

| 상황 | 처리 |
|---|---|
| `ProblemDetail.detail` 있음 | 그대로 `toast.error` |
| 네트워크 오류·detail 없음 | "요청 처리 중 오류가 발생했습니다." |
| 400 `INVALID_REQUEST` | 폼 옆이 아니라 토스트(필드 매핑 정보가 응답에 없음) |
| 403 `ADMIN_FORBIDDEN` | 토스트. 버튼 숨김은 UX용이고 최종 판정은 서버 |
| 화면별 분기 code | §2~§8 각 화면의 "에러 분기" 표 참고 |

### 1.4 목록 · 필터 규칙

- 필터 `select` 변경은 **즉시** 재조회, 텍스트 검색은 **검색 버튼/Enter**로 재조회.
- 재조회는 항상 첫 페이지부터(`cursor` 초기화). "더 보기"는 `nextCursor`로 이어붙임.
- 기본 `size=20`.
- 빈 목록: "데이터가 없습니다." / 로딩 중 첫 페이지: "불러오는 중…".
- 행 클릭 → 상세. 행 안의 액션 버튼은 `@click.stop`.

### 1.5 폼 규칙

- 필수 필드는 라벨에 `*`. 브라우저 `required`·`maxlength`로 1차 검증, 서버 400은 토스트.
- 저장 중 버튼 `loading`(스피너 + disabled). 성공 시 토스트 후 목록으로 이동.
- 파괴적 액션(삭제·정지·탈퇴)은 `ConfirmDialog`. 되돌릴 수 없는 것은 `danger` 색.
- 날짜 입력은 `<input type="date">`(YYYY-MM-DD). 서버에는 그 문자열 그대로 전송.

### 1.6 공통 컴포넌트

| 컴포넌트 | 용도 |
|---|---|
| `PageHeader` | 제목 · 설명 · `#actions` 슬롯 |
| `DataTable<T>` | 컬럼 정의 + 행 슬롯. 로딩·빈 상태 내장. `clickable`·`rowClick` |
| `LoadMore` | `hasNext`일 때만 "더 보기" |
| `Badge` | 상태 표시. tone: gray · green · yellow · red · blue |
| `BaseModal` / `ConfirmDialog` | 모달 · 확인창(`danger`·`loading`) |
| `FormField` · `TextInput` · `TextArea` · `SelectField` · `Toggle` | 폼 |
| `BaseButton` | primary · secondary · danger, `loading` |
| `Card` · `EmptyState` | 컨테이너 · 빈 상태 |

### 1.7 API 모듈 · 타입

- `src/api/client.ts` — baseURL `${VITE_API_BASE_URL}/api/admin`. 모든 호출은 `src/api/*.api.ts`로만.
- `src/types/` — 백엔드 DTO와 1:1. **백엔드 응답 필드가 확정되면 이 문서와 타입을 동시에 고친다.**
- 응답 래핑: 단건 `{ data }`, 커서 `{ data: { items, nextCursor, hasNext } }`.

---

## 2. 로그인 (ADW-00-01) · 관리자 계정 (ADW-07-01)

### 로그인 화면
- 이메일 · 비밀번호 · 로그인 버튼. 자동완성 `username` / `current-password`.
- 소셜 로그인·비밀번호 찾기·비밀번호 변경 **없음**. 관리자는 SUPER가 생성하고, 비밀번호를 바꿔야 하면 계정을 비활성화하고 새로 만든다.

| API | 사용 |
|---|---|
| `POST /auth/login` `{ email, password }` → `{ accessToken, refreshToken, role }` | 로그인 |
| `GET /me` → `{ id, email, name, role }` | 세션 복원·사이드바 표시 |
| `POST /auth/reissue` · `POST /auth/logout` | 인터셉터·로그아웃 |

에러 분기:

| code | 처리 |
|---|---|
| `ADMIN_LOGIN_FAILED` 401 | "이메일 또는 비밀번호가 올바르지 않습니다." (어느 쪽인지 안 알려줌) |
| `ADMIN_ACCOUNT_LOCKED` 423 | "로그인 실패 횟수 초과로 계정이 잠겼습니다. 15분 후 다시 시도해주세요." |
| `ADMIN_ACCOUNT_DISABLED` 403 | detail 그대로 |

### 관리자 계정 화면 (SUPER 전용, `meta.superOnly`)
- 테이블: 이메일 · 이름 · 역할(배지) · 상태(활성/비활성) · 마지막 로그인 · 생성일 · 액션.
- 액션: 활성화 ↔ 비활성화 토글. **본인 계정 행은 액션 없음**(스스로 비활성화 방지).
- "계정 추가" 모달: 이메일 · 이름 · 역할(SUPER/OPERATOR) · 초기 비밀번호. 생성 후 목록 재조회.
- 비밀번호 변경·삭제 UI는 없음(비활성화 + 재생성으로 갈음).

| API | 사용 |
|---|---|
| `GET /accounts` → `[{ id, email, name, role, status, lastLoginAt, createdAt }]` | 목록 |
| `POST /accounts` `{ email, name, role, password }` → 201 | 추가 |
| `PATCH /accounts/{id}/status` `{ status: ACTIVE\|DISABLED }` → 204 | 토글 |

에러 분기: `DUPLICATE_ADMIN_EMAIL` 409 → detail 토스트, 모달 유지.

---

## 3. 대시보드 (ADW-01-01)

- 섹션 4개, 위에서부터: **회원** 타일 7개 · **콘텐츠** 타일 5개 · **문의** 타일 2개(미답변은 빨간 숫자) · **최근 14일 가입·탈퇴** 막대 그래프 · **최근 30일 탈퇴 사유** 표.
- 그래프는 라이브러리 없이 CSS 막대(가입=검정, 탈퇴=빨강). 툴팁은 `title` 속성. 데이터 없으면 섹션 숨김.
- 진입 시 `dashboard`와 `members/stats`를 `Promise.all`로 동시 호출. 하나라도 실패하면 토스트, 성공한 쪽만 표시.

| API | 사용 |
|---|---|
| `GET /dashboard` | 타일·탈퇴 사유 (응답 형식은 admin.md §9 그대로) |
| `GET /members/stats?from=&to=` → `[{ date, joined, withdrawn }]` | 오늘 포함 14일 |

미답변 문의 타일 클릭 → `/inquiries?status=RECEIVED` (후순위).

---

## 4. 회원 관리 (ADW-02-01 / 02-02)

### 목록
- 필터: 키워드(닉네임·이메일 부분일치, 검색 버튼) · 상태(`PENDING|ACTIVE|SUSPENDED|WITHDRAWN`) · 가입 경로(`GOOGLE|APPLE`, 백엔드 `OAuthProvider`).
- 컬럼: 닉네임 · 이메일 · 가입 경로 · 상태(배지: PENDING 노랑 · ACTIVE 초록 · SUSPENDED 빨강 · WITHDRAWN 회색) · 가입일.
- `WITHDRAWN`은 `deleted_at IS NOT NULL` 가상 상태. 탈퇴 회원의 닉네임·이메일은 null → "-".

### 상세
- 헤더: 닉네임 · 이메일 · 상태 배지 · (SUPER) 정지/해제 · 강제 탈퇴 버튼. `WITHDRAWN`이면 버튼 전부 숨김.
- 카드 3개:
  1. **프로필** — 회원 ID(mono) · 가입 경로 · 국가 · 가입일 · 선호 무드(배지).
  2. **활동** — 북마크 · 루트 · 문의 수 / 약관 동의(유형 · 시각).
  3. **상태 이력** — 정지일·사유 / 탈퇴일·사유. 둘 다 없으면 "이력이 없습니다."
- 정지: ConfirmDialog + 사유 textarea(200자). 해제: 확인만. 강제 탈퇴: danger 확인("저장 스팟·생성 루트가 삭제되며 되돌릴 수 없습니다.").
- 처리 후 상세 재조회.

| API | 사용 |
|---|---|
| `GET /members?keyword=&status=&provider=&cursor=&size=` | 목록 |
| `GET /members/{memberId}` | 상세 |
| `PATCH /members/{memberId}/status` `{ status: SUSPENDED\|ACTIVE, reason }` (SUPER) | 정지/해제 |
| `POST /members/{memberId}/withdrawal` (SUPER) | 강제 탈퇴 |

상세 응답 필드(프론트 가정 — 백엔드 확정 시 맞춤):

```json
{ "id": "uuid", "nickname": "moi", "email": "a@b.c", "provider": "GOOGLE", "status": "ACTIVE", "country": "KR",
  "createdAt": "…", "preferredMoods": ["CALM", "COZY"],
  "policyAgreements": [{ "type": "TERMS_OF_SERVICE", "agreedAt": "…" }],
  "bookmarkCount": 36, "routeCount": 6, "inquiryCount": 1,
  "suspendedAt": null, "suspendReason": null, "deletedAt": null, "withdrawalReason": null }
```

---

## 5. 공지 관리 (ADW-03-01 / 03-02)

### 목록
- 필터: 유형(`ANNOUNCEMENT|MAINTENANCE|UPDATE|ISSUE|EVENT|OTHER`, 백엔드 `NoticeType`) · 노출(전체/노출/숨김).
- 유형 라벨: 공지 · 점검 · 업데이트 · 장애 · 이벤트 · 기타. 등록 기본값 `ANNOUNCEMENT`.
- 컬럼: 유형(배지) · 제목 · 노출(배지) · 게시일 · 액션(숨기기/노출 토글 · 삭제).
- 노출 토글은 목록에서 바로(`PATCH .../visibility`), 재조회 없이 행 상태만 갱신.
- 삭제는 하드 삭제 → danger 확인 "삭제된 공지는 복구할 수 없습니다."

### 등록/수정 (같은 폼, `/notices/new` · `/notices/:id`)
- 유형 · 게시일(기본 오늘) · 제목(≤100) · 내용(≤10,000, textarea 14줄) · 노출 토글.
- 수정 진입 시 `GET /notices/{id}`로 채움. 실패 시 목록으로.
- 마크다운/에디터 **없음**(앱이 plain text 렌더). 필요해지면 별도 결정.

| API | 사용 |
|---|---|
| `GET /notices?type=&visible=&cursor=&size=` (숨김 포함) | 목록 |
| `GET /notices/{id}` · `POST /notices` · `PUT /notices/{id}` | 폼 |
| `PATCH /notices/{id}/visibility` `{ visible }` · `DELETE /notices/{id}` | 목록 액션 |

---

## 6. FAQ 관리 (ADW-04-01)

한 화면에서 카테고리와 항목을 모두 다룬다(페이지 이동 없음).

```
[카테고리 카드]  ▾ 이름  [노출]  N개        ▲ ▼  ＋  ✎  🗑
  ├ 질문 1  (숨김)                          ▲ ▼  ✎  🗑
  │   답변 2줄 미리보기
  └ 질문 2                                  ▲ ▼  ✎  🗑
```

- 카테고리 카드: 접기/펼치기, 이름, 노출 배지, 항목 수, 액션(위·아래 · 항목 추가 · 수정 · 삭제).
- 항목 행: 질문(한 줄 말줄임) · 숨김 배지 · 답변 2줄 미리보기 · 액션(위·아래 · 수정 · 삭제).
- **순서 변경**: 드래그 대신 ▲▼. 한 칸 이동할 때마다 전체 ID 배열을 `order` API로 보내고 재조회(백엔드가 `sort_order = index`로 교체). 첫/마지막은 버튼 disabled.
- 카테고리 모달: 이름(≤50) · 노출. 항목 모달(넓게): 카테고리 select(이동 가능) · 질문(≤200) · 답변(≤5,000) · 노출.
- 모든 변경 후 `GET /faqs` 전체 재조회(데이터 작음).

| API | 사용 |
|---|---|
| `GET /faqs` → `[{ id, name, visible, sortOrder, faqs: [{ id, categoryId, question, answer, visible, sortOrder }] }]` | 전체 |
| `POST /faq-categories` · `PUT /faq-categories/{id}` · `DELETE /faq-categories/{id}` | 카테고리 |
| `PUT /faq-categories/order` `{ ids }` | 카테고리 순서 |
| `POST /faqs` · `PUT /faqs/{id}` · `DELETE /faqs/{id}` | 항목 |
| `PUT /faq-categories/{id}/faqs/order` `{ ids }` | 항목 순서 |

에러 분기:

| code | 처리 |
|---|---|
| `FAQ_CATEGORY_NOT_EMPTY` 409 | "항목이 남아 있는 카테고리는 삭제할 수 없습니다. 항목을 먼저 삭제하거나 이동하세요." 확인창 유지 |
| `INVALID_REQUEST` (순서 ID 누락·중복) | 토스트 후 재조회(화면 상태가 서버와 어긋난 경우) |

---

## 7. 약관 관리 (ADW-05-01 / 05-02)

### 목록
- 필터: 약관 유형(`TERMS_OF_SERVICE|PRIVACY_POLICY`, 백엔드 `PolicyType`. 가입 필수 약관과 1:1이라 종류 추가는 백엔드 `AgreementType`과 같이 결정).
- 컬럼: 약관 · 버전(mono) · 시행일 · 상태(**시행 중** 초록 / **시행 예정** 노랑) · 등록일 · 액션.
- 상태는 프론트에서 `effectiveAt > 오늘` 로 계산(서버 시각과 하루 차이 날 수 있음 → 최종 판정은 서버 409).
- 삭제 버튼은 **시행 예정만** 노출.

### 등록/수정/전문 (같은 폼)
- 등록: 약관 · 버전(≤20) · 시행일(오늘 이후) · 전문(textarea 24줄).
- 시행 예정 버전 수정: 전 필드 편집 가능.
- **시행된 버전**: 읽기 전용(전 필드 disabled) + "시행 중 · 읽기 전용" 배지 + **"이 내용으로 새 버전"** 버튼 → `/policies/new?from={id}` 로 이동해 유형·전문만 복사(버전·시행일은 비움). 오탈자도 새 버전으로 고친다는 백엔드 정책(§6)을 UI가 그대로 강제.

| API | 사용 |
|---|---|
| `GET /policies?type=` (미래 시행분 포함, `effectiveAt DESC`) | 목록 |
| `GET /policies/{id}` · `POST /policies` · `PUT /policies/{id}` · `DELETE /policies/{id}` | 폼·삭제 |

에러 분기:

| code | 처리 |
|---|---|
| `POLICY_VERSION_DUPLICATE` 409 | "같은 약관에 이미 존재하는 버전입니다." 폼 유지 |
| `POLICY_ALREADY_EFFECTIVE` 409 | "이미 시행된 약관은 수정할 수 없습니다. 새 버전으로 등록하세요." |

---

## 8. 1:1 문의 (ADW-06-01 / 06-02)

### 목록
- 필터: 상태(`RECEIVED|ANSWERED`) · topic 텍스트(검색 버튼).
- 컬럼: 상태(RECEIVED 빨강 · ANSWERED 초록) · 유형 · 제목 · 회원(닉네임 + 이메일 2줄, 탈퇴면 "탈퇴 회원") · 접수일 · 답변일.
- 정렬은 서버(RECEIVED 우선 · createdAt DESC). 프론트 정렬 없음.

### 상세
- 좌(2/3): 문의 본문 카드(topic · 접수일 · 내용 · 첨부 썸네일 → 새 탭) + 답변 카드.
- 우(1/3): 회원 카드(닉네임 · 이메일, 탈퇴면 안내).
- 답변 카드: 기존 답변 있으면 textarea에 채우고 "답변 수정", 없으면 "답변 등록". 안내 문구 "다시 등록하면 덮어씁니다." 저장 후 상세 재조회.
- 첨부 URL은 서명 URL(만료 5분) → 화면 진입 시점 기준. 만료 시 이미지 깨짐 → 새로고침 안내(후순위).

| API | 사용 |
|---|---|
| `GET /inquiries?status=&topic=&cursor=&size=` | 목록 |
| `GET /inquiries/{id}` → `{ …summary, content, attachmentUrls[], answer, answeredBy }` | 상세 |
| `PUT /inquiries/{id}/answer` `{ content }` | 답변 |
| `GET /inquiries/count?status=RECEIVED` → `{ count }` | 사이드바 배지(후순위) |

---

## 9. 스팟 관리 (ADW-08-01 / 08-02) — 개발자 B API 이후

백엔드 §8이 "요구사항만" 상태라 **화면은 정의만 하고 구현은 API 확정 후**.

### 목록
- 필터: 키워드 · 상태(`ACTIVE|HIDDEN|DELETED`) · 지역(region).
- 컬럼: 썸네일 · 이름 · 지역 · 카테고리 · 무드 태그(배지 최대 3 + "+N") · 상태 · 북마크 수 · 수정일.
- 액션: "TourAPI 재동기화" 버튼(PageHeader, SUPER, 확인창) → `POST /spots/sync`. 실행 후 "배치가 시작되었습니다" 토스트(결과 폴링 없음).

### 상세
- 좌: 원본 TourAPI 데이터(읽기 전용 표) · 이미지.
- 우: 편집 카드 3개
  1. **상태** — `ACTIVE|HIDDEN|DELETED` + 사유 → `PATCH /spots/{id}/status`. `DELETED`는 SUPER + danger 확인("루트·북마크에 들어 있는 스팟은 앱에서 '삭제된 스팟'으로 표시됩니다").
  2. **무드 태그** — 무드 enum 체크박스 → `PUT /spots/{id}/moods`.
  3. **AI 설명** — 언어별 textarea(ko/en …) → `PUT /spots/{id}/description`. "재생성" 버튼 → `POST /spots/{id}/regenerate`(배치 큐, 즉시 반영 안 됨 안내).
- 번역 필드 구조·무드 enum 목록은 B와 확정 필요.

---

## 10. 라우트 · 파일 구조

```
src/
├── api/            client · auth · accounts · dashboard · members · notices · faqs · policies · inquiries · (spots)
├── types/          api · auth · member · support · dashboard · (spot)
├── stores/auth.ts
├── router/index.ts  meta: { title, public?, superOnly? }
├── layouts/DashboardLayout.vue
├── components/common/
├── composables/useCursorList.ts
├── utils/          token · error · format · labels
└── views/{auth,dashboard,members,notices,faqs,policies,inquiries,accounts,(spots)}/
```

| 라우트 | name | meta |
|---|---|---|
| `/login` | login | public |
| `/` | dashboard | |
| `/members`, `/members/:memberId` | members, member-detail | |
| `/notices`, `/notices/new`, `/notices/:id` | notices, notice-new, notice-edit | |
| `/faqs` | faqs | |
| `/policies`, `/policies/new`, `/policies/:id` | policies, policy-new, policy-edit | |
| `/inquiries`, `/inquiries/:id` | inquiries, inquiry-detail | |
| `/accounts` | accounts | superOnly |
| `/spots`, `/spots/:id` | spots, spot-detail | (§9 이후) |
| `/:pathMatch(.*)*` | → `/` | |

---

## 11. 배포 · 환경

| 환경 | `VITE_API_BASE_URL` | 비고 |
|---|---|---|
| local | `http://localhost:8080` | `vite dev` 프록시 `/api` → 백엔드, 포트 5174 |
| dev | `https://dev-api.moodi.kr` | |
| prod | `https://admin.moodi.kr` | Firebase Hosting 별도 사이트, `/api/**` → Cloud Run rewrite (동일 오리진이라 CORS 불필요) |

- 빌드: `npm run build` (vue-tsc 타입체크 포함). CI에서 이 명령이 게이트.
- `index.html`에 `robots: noindex, nofollow`.
- 호스트 분리로 백엔드 §16-3(관리자 접근 제한)은 `admin.moodi.kr` 사이트 단위로 IP 제한·Basic 인증을 걸 수 있는 여지를 남긴다.

---

## 12. 구현 순서 (백엔드 ADM-F0x 와 맞춤)

| 순서 | 화면 | 백엔드 | 프론트 상태 |
|---|---|---|---|
| 1 | 로그인 · 관리자 계정 (§2) | ADM-F01 | 구현됨 |
| 2 | 공지 · FAQ · 약관 (§5~7) | ADM-F02 | 구현됨 |
| 3 | 1:1 문의 (§8) | ADM-F03 | 구현됨 |
| 4 | 회원 관리 · 정지 (§4) | ADM-F04 | 구현됨 |
| 5 | 대시보드 (§3) | ADM-F05 | 구현됨 |
| 6 | 스팟 관리 (§9) | ADM-F06 (B) | 미구현 — API 확정 대기 |

"구현됨"은 백엔드 API 없이 스펙 기준으로 작성된 상태. **각 ADM-F0x가 머지되면 응답 필드를 `src/types/`와 대조해 맞추는 작업이 한 번씩 필요**하다(특히 §4 회원 상세, §6 FAQ 트리, §8 첨부 URL).

---

## 13. 열린 질문 (합의 필요)

1. **공지·FAQ 답변 서식** — plain text 유지 vs 마크다운. 앱 렌더링 방식에 따름.
2. **문의 첨부 서명 URL 만료(5분)** — 상세 화면에서 만료 시 재발급 API 필요 여부.
3. **미답변 문의 배지** — 사이드바에 `GET /inquiries/count` 실시간 표시 여부(폴링 주기).

### 결정된 항목
- **호스팅**: `admin.moodi.kr` 별도 Firebase Hosting 사이트 (2026-09-13).
- **관리자 비밀번호 변경**: API·화면 없음. 비활성화 + 재생성으로 갈음 (2026-09-13).
- **enum**: 백엔드 실제 값으로 확정 — `NoticeType` 6종, `PolicyType` 2종, `OAuthProvider` GOOGLE·APPLE. `MemberStatus`의 SUSPENDED·WITHDRAWN은 ADM-F04에서 추가 (2026-09-13).

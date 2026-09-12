# 어드민 웹 스펙 (Spec)

백엔드 `moodi-api/docs/spec/admin.md`(관리자 백엔드 스펙)를 기준으로 어드민 웹이 제공해야 할 화면·라우트·상태·API 연동을 정리한다.
구현 전 합의용 문서이며, 화면 ID는 백엔드 스펙 섹션(§)과 대응시킨다.

| 문서 | 범위 |
|---|---|
| [admin-web.md](./admin-web.md) | 어드민 웹 전체 — 공통(인증·레이아웃·에러·페이징), 대시보드, 회원, 공지, FAQ, 약관, 문의, 관리자 계정, 스팟(B) |

## 화면 ID ↔ 백엔드 스펙 매핑

| 화면 ID | 화면명 | 라우트 | 백엔드 |
|---|---|---|---|
| ADW-00-01 | 로그인 | `/login` | admin.md §2 |
| ADW-01-01 | 대시보드 | `/` | admin.md §9, §3(stats) |
| ADW-02-01 / 02-02 | 회원 목록 · 상세 | `/members`, `/members/:memberId` | admin.md §3 |
| ADW-03-01 / 03-02 | 공지 목록 · 등록/수정 | `/notices`, `/notices/new`, `/notices/:id` | admin.md §4 |
| ADW-04-01 | FAQ 관리 | `/faqs` | admin.md §5 |
| ADW-05-01 / 05-02 | 약관 목록 · 등록/수정/전문 | `/policies`, `/policies/new`, `/policies/:id` | admin.md §6 |
| ADW-06-01 / 06-02 | 문의 목록 · 상세/답변 | `/inquiries`, `/inquiries/:id` | admin.md §7 |
| ADW-07-01 | 관리자 계정 | `/accounts` | admin.md §2 (SUPER) |
| ADW-08-01 / 08-02 | 스팟 목록 · 상세 | `/spots`, `/spots/:id` | admin.md §8 (개발자 B) |

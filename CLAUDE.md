@AGENTS.md

# UCC 유크크 웹

- 제품 정보는 PRODUCT.md, 화면 방향은 .impeccable/surfaces/src-app.md(방향 계약). 1차 사용자는 학생회 운영진.
- Next.js 16: middleware 대신 `src/proxy.ts`. 코드 쓰기 전에 `node_modules/next/dist/docs/` 확인.
- 권한은 RLS + RPC. 사용자 식별은 `auth.uid()`가 아니라 `public.me()`(익명 세션 → 페르소나 프로필).
- 서버 전용(`lib/viewer.ts`, `lib/manage.ts`)을 클라이언트 컴포넌트에서 import하지 않는다. 클라이언트에서 쓰는 로직은 `lib/phase.ts`, `lib/format.ts`.
- 마이그레이션은 Supabase MCP로 적용. DELETE가 들어간 SQL은 사람 승인이 필요하다.
- 날짜는 항상 Asia/Seoul로 표시(`lib/format.ts`). 숫자는 `num` 유틸(tabular-nums).
- 문구는 해요체, 숫자로 말한다. 구현 안 된 기능(알림 등)을 된다고 쓰지 않는다.

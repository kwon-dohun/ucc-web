# UCC 유크크 · 웹

학생회·동아리 운영을 카톡, 구글폼, 엑셀 대신 한곳에서. 작년 행사에서 시작하고, 끝나면 저절로 기록돼요.

2026 기술경영융합대학 학습환경 개선 아이디어 공모전 기획안(팀 뉴비)을 웹 서비스로 옮긴 데모예요. 화면 속 이름, 학번, 학생회 이름은 모두 가명이고 숫자는 예시예요.

## 데모로 볼 수 있는 것

첫 화면에서 역할을 고르면 바로 들어가요.

| 역할 | 페르소나 | 볼 것 |
|---|---|---|
| 운영진 | 김서연, ITM 학생회 부학생회장 | 운영 홈, 실시간 신청 현황, 작년 행사 복제, 수령 체크, 현장 배부, 대여 관리, 지난 활동 |
| 학생회장 | 박지호 | 운영진 기능 + 임기 넘기기 |
| 학생 | 정하늘, ITM 2학년 | 이번 주, 기회 찾기(EPiC 필터), 간식 신청, 대여 현황, 건의 |

추천 순서: 운영진으로 들어가서 진행 중인 간식행사의 남은 개수를 보고, 다른 브라우저에서 학생으로 신청하면 운영 화면 숫자가 실시간으로 줄어요. 운영 화면의 "데모: 신청 3건 더"로도 볼 수 있어요.

## 무엇이 다른가

- **한 번 입력하면 끝.** 학생은 이름, 학번, 학년을 다시 적지 않고 신청해요.
- **작년 위에서 시작.** 지난 행사를 복제하면 바뀌는 칸만 코럴 빈칸으로 남아요.
- **기록은 따로 쓰지 않아도 쌓여요.** 신청, 수령 체크, 현장 배부에서 숫자가 뽑혀 "41분 만에 60개 마감, 안 온 신청자 4명"처럼 남고, 다음 기수가 이어받은 한 줄과 함께 봐요.
- **공식 사실은 만들지 않아요.** 기회 추천 이유는 원문과 학생이 고른 관심에서 확인되는 사실만 적고, 신청은 EPiC 원문으로 연결해요.

## 스택

- Next.js 16 (App Router, `proxy.ts`), React 19, Tailwind CSS v4, lucide 아이콘, Pretendard
- Supabase: Postgres, RLS, Realtime(남은 개수·신청 명단), RPC(선착순 신청, 수령 체크, 대여, 임기 넘기기)
- Vercel 배포

## 구조

```
src/
  app/
    page.tsx              첫 화면, 데모 역할 고르기
    (app)/                로그인 뒤 화면 (사이드바 · 모바일 탭바)
      home, find, calendar, org, events, me      학생 화면
      manage/                                    운영 화면
        events/new, events/[id]/edit, events/[id]
        history, history/[seriesId], rental, team
    actions/              서버 액션
  components/             live-event(실시간 운영 콘솔), agenda, ui …
  lib/                    supabase 클라이언트, viewer(페르소나), 날짜·기회 로직
supabase/migrations/      스키마, RLS, RPC, 데모 데이터
```

## 로컬에서 실행

```bash
npm install
cp .env.example .env.local   # Supabase URL과 publishable key
npm run dev
```

Supabase 프로젝트에는 `supabase/migrations`를 번호 순서대로 적용하고, Authentication에서 **Anonymous sign-ins**를 켜요. 데모 로그인은 익명 세션에 페르소나를 연결하는 방식이라 비밀번호가 없어요.

## 권한

- 데이터 접근은 전부 RLS로 막아요. 권한 판단은 `me()`(지금 세션이 고른 프로필) 기준이에요.
- 신청·수령·대여 같은 쓰기는 RPC 안에서 운영진 여부를 확인해요.
- 학생 본인 기록(신청, 대여)은 본인과 그 조직 운영진만 봐요.

팀 뉴비(NewBy) · ITM전공

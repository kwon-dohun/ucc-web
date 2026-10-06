---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

Scope: 앱 전체(학생 화면 + 운영 콘솔). Mode: Operate. 1차 사용자 운영진, 데모 1차 관객은 파일럿 학생회·동아리 운영진.

## Direction contract
THESIS: 운영진이 "작년 위에서 시작한다"를 손으로 느끼는 콘솔. 기본 SaaS 대시보드(지표 카드 4개 + 차트)를 거부하고, 숫자를 문장으로 말하는 기록 중심 화면("41분 만에 60개 마감", "안 온 신청자 7명").
OWN-WORLD: 밝은 화면, 살짝 차가운 회색 바탕(#F5F6F8)과 흰 작업면, 잉크 #15181D. 코럴 #F0503F는 주요 행동·지금 진행 중·빈칸(이번에 바꿀 칸)에만. 초록 #0E9B72는 "남아 있음/빌릴 수 있음". 학생회 부서색(기획 #3D5AE0, 홍보 코럴, 사무 #0E9B72, 회장단 #7C5BD6)은 캘린더 층과 조직도에만. Pretendard 단일 서체, 숫자는 tabular-nums. 모서리 12px, 선 1px, 그림자는 오프셋 있는 옅은 것만. 유리·그라데이션·아이콘 타일 카드 금지. 아이콘은 lucide 한 벌.
STORY: 운영진이 작년 간식행사를 복제해 바뀌는 4칸만 채워 공개 → 신청이 실시간으로 쌓이는 걸 보고 → 현장에서 폰으로 수령 체크 → 끝내면 숫자가 저절로 정리되어 다음 기수에게 남는다. 학생은 이름·학번 없이 한 번에 신청.
FIRST VIEWPORT: 운영 홈 = 왼쪽 사이드바(홈·찾기·캘린더·소속 + 운영 섹션), 본문 상단에 "오늘 챙길 것" 한 줄 요약, 바로 아래 진행 중 행사 한 건이 가로 전체를 쓰는 라이브 패널(메뉴별 남은 개수가 실시간으로 줄어드는 큰 숫자, 신청 명단 최근 순). 주요 행동 "새 행사 만들기"는 사이드바 운영 섹션 맨 위 코럴 버튼 하나.
FORM: 제품 UI 관례(사이드바+본문, 모바일 하단 탭바) 위에 기록 문장 체계. 시그니처 인터랙션: 라이브 남은 개수 숫자가 바뀔 때 세로로 넘어가는 숫자 롤, 그리고 복제 폼에서 지난번 값은 회색으로 채워지고 바꿀 칸만 코럴 점선 빈칸. seed: condensed (brand-pinned, no roll)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

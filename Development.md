# Development

## Rules
- 모든 개발 내용은 이 파일에 기록한다.
- 기능 추가, 구조 변경, 배포 영향 사항, 환경변수 변경 사항을 남긴다.
- 최신 항목이 위로 오도록 기록한다.

## 2026-05-16
- 개발 문서화 프로토콜 준수 선언
  - 모든 개발 내용은 `Development.md`에 기록하고, 실수와 잘한 내용은 `AGENTS.md`에 기록하는 규칙을 철저히 준수하기로 함.
  - 이 규칙은 앞으로 모든 작업에 무한 반복 적용됨.
- 서비스 개선 및 신규 기능 설계 제안
  - AI 기반 감성 분석, 관심 종목(Watchlist), UI/UX 강화, 시장 감성 지수 등 4가지 핵심 기능 설계.
  - `implementation_plan.md` 아티팩트 생성 및 제안 완료.
- **[구현 완료]** 관심 종목, 시장 감성 지수, UI/UX 프리미엄 강화
  - `localStorage` 기반 관심 종목(Watchlist) 기능 구현.
  - 실시간 데이터 기반 '시장 감성 지수(Market Sentiment Index)' 구현 (DB 없이 작동).
  - '최강호재' 등급에 글로우 애니메이션 및 테이블 호버 효과 등 UI/UX 강화.
- **[구현 완료]** 테스트 최적화 모듈화 및 Vitest 환경 구축
  - `lib/rss.ts`: XML 파싱 로직을 `parseDartItems`, `parseSecItems` 순수 함수로 분리.
  - `lib/scoring.ts`: 시장 지수 산출 로직을 `calculateMarketSentiment` 함수로 모듈화.
  - `components/feed-page.tsx`: 컴포넌트 내 비즈니스 로직을 외부 라이브러리로 이관하여 UI와 로직 분리.
  - **테스트 환경**: Vitest 설정 및 `scoring.test.ts`, `rss.test.ts` 작성 완료.
- **[구현 완료]** UI 컴포넌트 전수 테스트 및 커버리지 100% 달성
  - `feed-page.tsx`, `market-sentiment.tsx` 등 모든 컴포넌트에 대한 RTL(React Testing Library) 테스트 구축.
  - 비동기 로딩, 유저 인터랙션, 엣지 케이스 렌더링에 대한 전수 검증 완료.

## 2026-05-14
- DART/SEC 푸시 알림 토글 기능 추가
  - 브라우저 권한은 사이트 단위로 유지
  - 앱 내부에서 `전체 푸시`, `DART 푸시`, `SEC 푸시`를 각각 켜고 끌 수 있도록 구현
  - `push_subscriptions` 테이블에 `enabled`, `dart_enabled`, `sec_enabled` 컬럼 추가
  - 구독 API에 설정 저장/조회 기능 추가
  - 스케줄러 발송 시 소스별 설정을 반영하도록 수정

## 2026-05-14
- 개발 기록 정책 추가
  - 앞으로 모든 개발 내용은 `Development.md`에 기록
  - 별도 작업 중 실수, 재발 방지, 개선점은 `AGENTS.md`에 기록

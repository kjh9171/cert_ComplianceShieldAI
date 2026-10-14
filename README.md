<div align="center">

# 🛡️ ComplianceShield AI

**기업 및 기관의 법정 개인정보 컴플라이언스 문서를 자동으로 생성·관리하는 B2B SaaS**

개인정보 처리방침 · 내부관리계획서 · 임직원 보호지침 · 처리위탁 계약서 · 유출 사고 대응 매뉴얼

[![Next.js](https://img.shields.io/badge/Next.js-15.5-000?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-087ea4?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-000?logo=vercel)](https://vercel.com)

</div>

---

## 📌 서비스 개요

「개인정보 보호법」은 기업에 **처방하고·내부관리계획을 세우고·취급자를 통제하고·유출 시 신고할 것**을 요구합니다.
그러나 대부분의 조직은 이 문서들을 엑셀이나 Word로 개별 작성하고 있어, **내용 누락·법령 미반영·정기 갱신 누락**이 반복적으로 발생합니다.

ComplianceShield AI는 이 문제를 해결합니다.

| 문제 | ComplianceShield AI |
| --- | --- |
| 처리방침에 법정 기재 항목 누락 | 법 제30조 기준 **14개 기재 항목 자동 점검** |
| 업종에 맞지 않는 범용 문서 | **10개 업종 프리셋** — 쇼핑몰/병원/학원/금융/물류 등 수집 항목·보호조치·위탁 항목 자동 구성 |
| 내부관리계획 작성에 시간 소요 | **대화형 입력** — "우리 회사는 병원이야" 한마디로 4,600자 완성 |
| 정기 검토·갱신 누락 | **컴플라이언스 점검 대시보드** — 점수·등급·차기 검토일 알림 |
| 형식 파편화 | **DOCX · PDF · Markdown · 텍스트 · HWP 호환** 즉시 내보내기 |

---

## ⚡ 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev
# → http://localhost:3000

# 3. 프로덕션 빌드
npm run build && npm run start
```

> **API 키 없이도 100% 동작합니다.** 기본값은 내장된 한국어 규칙 엔진이며, 선택적으로 LLM을 연결하면 대화 품질이 향상됩니다.

---

## 🚀 Vercel 배포

1. 이 저장소를 GitHub에 푸시합니다.
2. [Vercel Dashboard](https://vercel.com) → **Add New → Project**
3. 저장소를 선택하면 **Framework: Next.js** 가 자동 감지됩니다.
4. **Deploy** 클릭 → `https://your-app.vercel.app` 발급 (자동 SSL)

빌드 설정 변경이 필요 없습니다. 환경 변수는 모두 **선택 사항**입니다.

<details>
<summary><b>선택 환경 변수</b> 클릭</summary>

| 변수 | 설명 |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude 연동 (권장). 입력 시 `/api/chat` 가 LLM을 사용합니다. |
| `OPENAI_API_KEY` | OpenAI 연동. Anthropic 키가 없을 때 사용됩니다. |
| `LLM_MODEL` | 모델명 (기본 `claude-sonnet-4-5`) |
| `LLM_ENABLED` | `false` 로 설정하면 규칙 엔진만 사용 (비용 절약) |

</details>

---

## 📚 생성 가능한 문서 5종

| 문서 | 법적 근거 | 규모 | 주요 내용 |
| --- | --- | --- | --- |
| **개인정보 처리방침** | 법 제30조 · 시행령 제32조 | 약 12,400자 | 처리 목적 · 보유기간 · 파기 · 제3자 제공 · 처리위탁 · 국외이전 · 자동화된 결정 · 권리 행사 · CPO |
| **개인정보 내부관리계획서** | 법 제29조 · 시행령 제30조 | 약 12,500자 | 기술적/관리적/물리적 보호조치 · CPO 권한 · 정기 점검 · 수탁자 관리 · 사고 대응 |
| **임직원 개인정보 보호지침** | 법 제28조 | 약 5,300자 | 처리 단계별 수칙 · 계정/문서/출력물/시스템 보안 · 위반 시 제재 · 서약서 |
| **개인정보 처리위탁 계약서** | 법 제22조 제3항 · 제26조 | 약 8,200자 | 위탁 범위 · 수탁자 의무 · 재위탁 제한 · 감사권 · 사고 통지 · 반환·파기 |
| **유출 사고 대응 매뉴얼** | 법 제34조 (72시간) | 약 9,300자 | 0~5단계 대응 절차 · 신고 기준 · 정보주체 통지문 · 연락망 · 사고 기록 보관 |

### 업종 프리셋

`일반 기업` · `쇼핑몰/전자상거래` · `IT·SaaS·클라우드` · `의료·병원` · `교육·학원` · `금융·핀테크` · `물류·배송` · `제조` · `마케팅·광고` · `미디어·커뮤니티`

업종을 선택하면 **수집 개인정보 항목 · 안전성 확보조치 · 처리위탁 · 제3자 제공 · 국외이전** 항목이 자동으로 구성됩니다.

---

## 🗂️ 프로젝트 구조

```text
cert_ComplianceShieldAI/
├── app/
│   ├── layout.tsx                  # 루트 레이아웃 (Noto Sans/Serif KR)
│   ├── page.tsx                    # 메인 진입점
│   ├── globals.css                 # 밝은 테마 디자인 시스템
│   ├── opengraph-image.tsx         # OG 이미지 생성
│   └── api/
│       ├── generate/route.ts       # POST  문서 생성
│       ├── chat/route.ts           # POST  자연어 → 문서 변경
│       └── export/route.ts         # POST  docx / pdf / md / txt / hwp
│
├── components/
│   ├── ComplianceApp.tsx           # 앱 셸 · 상태 연결
│   ├── AppHeader.tsx               # 헤더 · 내비게이션 · 문서 전환
│   ├── ChatPanel.tsx               # 대화형 문서 생성 패널
│   ├── DocumentPreview.tsx         # 블록 모델 렌더러
│   ├── ui/Primitives.tsx           # Toast · ScoreRing · StatCard · EmptyState
│   └── views/
│       ├── DashboardView.tsx       # 대시보드
│       ├── GeneratorView.tsx       # 문서 작성 워크스페이스
│       ├── VaultView.tsx           # 보관함 · 버전 관리
│       ├── AuditView.tsx           # 컴플라이언스 점검
│       └── DeployView.tsx          # 배포 가이드 · API 문서
│
├── lib/
│   ├── types.ts                    # 도메인 타입 · 블록 모델
│   ├── catalog.ts                  # PII 59종 · 보호조치 27종 · 업종 10종
│   ├── state.ts                    # 상태 생성 · 패치 적용기
│   ├── compliance.ts               # 점검 항목 31개 · 점수 산정
│   ├── render/
│   │   ├── privacyPolicy.ts        # 개인정보 처리방침
│   │   ├── internalPlan.ts         # 내부관리계획서
│   │   ├── securityGuideline.ts    # 임직원 보호지침
│   │   ├── outsourceAgreement.ts   # 처리위탁 계약서
│   │   ├── breachManual.ts         # 유출 사고 대응 매뉴얼
│   │   ├── serialize.ts            # 블록 → 텍스트 / Markdown
│   │   └── index.ts                # 렌더링 진입점
│   ├── chat/
│   │   ├── lexicon.ts              # 한국어 표현 사전
│   │   └── rules.ts                # 규칙 기반 의도 분석기
│   ├── llm.ts                      # 선택적 LLM 연동 (Anthropic / OpenAI)
│   ├── docx.ts                     # DOCX 생성기
│   ├── store.ts                    # localStorage 영속화
│   └── utils.ts
│
└── scripts/
    ├── check-text.cjs              # 한국어 텍스트 무결성 검사
    ├── check-catalog.cjs           # 카탈로그 참조 무결성 검사
    ├── test-rules.ts               # 규칙 엔진 회귀 테스트 (16건)
    ├── test-docx.ts                # DOCX 생성 검증 (5건)
    └── test-api.mjs                # API 통합 테스트 (36건)
```

---

## 🧠 아키텍처

### 단일 블록 모델

5종 문서 모두 **동일한 블록 모델**을 사용합니다. 미리보기 · DOCX · PDF · Markdown · 텍스트가 같은 입력을 소비하므로 **어떤 출력 경로에서도 내용이 동일**합니다.

```ts
type Block =
  | { kind: 'title';    text: string; subtitle?: string }
  | { kind: 'meta';     rows: [string, string][] }
  | { kind: 'heading';  level: 1 | 2 | 3; num?: string; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list';     ordered?: boolean; items: string[] }
  | { kind: 'table';    head: string[]; rows: string[][]; widths?: number[] }
  | { kind: 'note';     tone: 'info' | 'warn' | 'danger'; title?: string; text: string }
  | { kind: 'signature'; roles: string[] }
  | { kind: 'appendix'; title: string; blocks: Block[] }
  | { kind: 'divider' } | { kind: 'pagebreak' };
```

### 대화형 편집 — 하나의 패치 계약

규칙 엔진과 LLM은 **같은 `PatchOp` 계약**을 사용합니다. 따라서 LLM을 나중에 추가해도 프런트엔드·검증 로직을 바꿀 필요가 없습니다.

```ts
type PatchOp =
  | { op: 'setField';        path: string; value: unknown }   // 허용 경로 화이트리스트
  | { op: 'addPii';          id: string }
  | { op: 'removePii';       id: string }
  | { op: 'addSafeguard';    id: string }
  | { op: 'removeSafeguard'; id: string }
  | { op: 'addPurpose';      value: string }
  | { op: 'addRetentionRule' | 'addEntrusted' | 'addThirdParty' | 'addOverseas'; value: object }
  | { op: 'switchTemplate';  id: TemplateId };
```

**2단계 실행 구조** (`/api/chat`):

1. `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` 가 있으면 LLM 호출 (10초 타임아웃, 실패 시 자동 폴백)
2. 없거나 실패하면 `lib/chat/rules.ts` 의 한국어 규칙 엔진 사용

> 두 엔진 모두 동일한 서버 측 검증(`applyPatches`)을 거치므로, 잘못된 경로나 미지의 ID는 **서버에서 차단**됩니다.

### 출력 형식별 처리 방식

| 형식 | 방식 | 한글 처리 |
| --- | --- | --- |
| **DOCX** | 서버에서 `docx` 라이브러리로 실제 바이너리 생성 | `맑은 고딕` 서체 지정, 표/머리말/쪽 번호 포함 |
| **PDF** | A4 인쇄 최적화 HTML → 인쇄 대화상자에서 "PDF로 저장" | 폰트 임베딩 불필요, 텍스트 선택·검색 가능 |
| **Markdown** | 블록 → MD 변환 | 위키·Notion·GitHub 붙여넣기 |
| **텍스트 / HWP** | 순수 텍스트 | 한글 프로그램 붙여넣기 |

> PDF를 서버 렌더링하지 않는 이유: 한글 PDF 생성에는 5MB 이상의 서체 임베딩이 필요해 서버리스 번들 제한(4.5MB)을 초과합니다.
> 브라우저 인쇄 방식은 의존성 없이 완전한 한글 PDF를 만들 수 있어 프로덕션에 더 적합합니다.

---

## 🔌 REST API

### `POST /api/generate` — 문서 생성

```bash
curl -X POST "https://your-app.vercel.app/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "privacy-policy",
    "state": {
      "org": {
        "name": "주식회사 에이비씨",
        "cpo": { "name": "김철수", "email": "privacy@abc.co.kr", "phone": "02-000-0000" },
        "effectiveDate": "2026-10-14"
      },
      "processing": { "industry": "ecommerce" }
    }
  }'
```

**응답**

```jsonc
{
  "templateId": "privacy-policy",
  "blocks": [ /* Block[] — 90개 */ ],
  "plainText": "주식회사 에이비씨 개인정보 처리방침\n...",
  "markdown": "# 주식회사 에이비씨 개인정보 처리방침\n...",
  "fileSlug": "주식회사_에이비씨_개인정보_처리방침_2026-10-14",
  "wordCount": 12376
}
```

`state` 는 **부분 병합**됩니다. 보낸 필드만 반영되고, 생략된 필드는 기본값이 유지됩니다.

### `POST /api/chat` — 대화형 수정

```bash
curl -X POST "https://your-app.vercel.app/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "주민등록번호 추가하고 유출방지 조치 적용해줘",
    "state": {}
  }'
```

**응답**

```jsonc
{
  "reply": "2개의 요청을 문서에 적용했습니다.",
  "engine": "rules",          // "rules" | "anthropic" | "openai"
  "ops": [ /* PatchOp[] */ ],
  "applied": ["수집 항목 추가: 주민등록번호", "보호조치 적용: 데이터 유출방지(DLP) 솔루션 도입…"],
  "skipped": [],
  "suggestions": ["내부관리계획서로 문서를 바꿔줘"],
  "state": { /* 변경이 적용된 전체 DocState */ }
}
```

### `POST /api/export` — 파일 변환

```bash
# DOCX 다운로드
curl -X POST "https://your-app.vercel.app/api/export" \
  -H "Content-Type: application/json" \
  -d '{"templateId":"internal-plan","format":"docx","state":{}}' \
  --output 내부관리계획서.docx
```

| `format` | 결과 |
| --- | --- |
| `docx` | `application/vnd.openxmlformats-...` (파일 다운로드) |
| `pdf` | `text/html` — A4 인쇄 최적화 문서 (인쇄 대화상자에서 PDF 저장) |
| `md` / `txt` / `hwp` | 텍스트 (파일 다운로드) |

파일명에 한글이 포함될 경우 RFC 5987 인코딩(`filename*=UTF-8''…`)으로 제공됩니다.

---

## ✅ 품질 검증

```bash
npm run verify     # typecheck + 텍스트/카탈로그 검사 + 규칙/DOCX 테스트
npm run test:api   # 서버 기동 상태에서 API 통합 테스트
npm run lint
```

| 검사 | 내용 | 결과 |
| --- | --- | --- |
| `check:text` | 한국어 문자열의 토큰 무결성 (한자 혼입 · 한글+영문 혼합 · mojibake) | 34개 파일 |
| `check:catalog` | 업종 프리셋이 참조하는 PII/보호조치 ID 실재 여부 | 59 + 27개 |
| `test:rules` | 한국어 의도 분석 회귀 테스트 | 16/16 통과 |
| `test:docx` | DOCX XML 엔티티 누출 · 한글 서체 · 표 구조 | 5/5 통과 |
| `test:api` | 엔드포인트·오류 처리·헤더·정적 자산 | 36/36 통과 |
| `eslint` | React Hooks · 미사용 변수 | 0 errors / 0 warnings |

> `check:text` 는 한국어 문서 생성 특유의 실수를 자동 감지하기 위해 작성된 스크립트입니다.
> 한글이 길게 이어지는 소스에서 토큰이 깨지면(예: `위반을Objective`) 빌드 이전 단계에서 즉시 잡힙니다.

---

## 🎨 디자인

밝고 신뢰감 있는 기업용 톤을 지향합니다.

- **밝은 테마** — `bg-slate-50` 캔버스 + 화이트 카드 + 인디고(#3363FF) 액센트
- **문서 영역은 명조 계열** — `Noto Serif KR` 로 법원·공문서와 유사한 인쇄감
- **UI 영역은 고딕** — `Noto Sans KR` + `Inter` 로 가독성 확보
- **의미 기반 색상** — emerald(충족) · amber(주의) · rose(미충족) · brand(중요)
- **접근성** — `:focus-visible` 링, 시맨틱 랜드마크, `prefers-reduced-motion` 대응, 스킵 링크

---

## 🗺️ 로드맵

- [x] 5종 법정 문서 자동 생성
- [x] 업종 프리셋 10종
- [x] 대화형 입력 (규칙 엔진 + 선택적 LLM)
- [x] DOCX / PDF / Markdown / 텍스트 내보내기
- [x] 컴플라이언스 자동 점검 및 점수 산정
- [x] 문서 버전 보관함
- [x] REST API 3종
- [ ] 다중 조직(테넌트) 및 팀 협업
- [ ] SSO / OAuth 로그인 (NextAuth)
- [ ] PostgreSQL 기반 서버 영속화
- [ ] 법령 개정 자동 감지 및 알림
- [ ] 전자서명 및 결재 워크플로우
- [ ] 처리방침 웹사이트 퍼블리싱 위젯

---

## ⚖️ 법적 고지

본 서비스가 생성하는 문서는 **「개인정보 보호법」 및 관계 법령의 기재 요건을 바탕으로 작성된 초안**입니다.

- 실제 사용 시 귀하의 업무 특성에 맞는 검토와 수정이 필요합니다.
- 대규모 사업장이나 민감정보를 다룰 경우 법무 담당자의 검토를 권장합니다.
- 법령이 개정되는 경우 템플릿은 버전으로 관리되며, 수동 갱신이 필요합니다.

---

## 📄 라이선스

MIT

<div align="center">
<sub>ComplianceShield AI · Built with Next.js, React, Tailwind CSS</sub>
</div>
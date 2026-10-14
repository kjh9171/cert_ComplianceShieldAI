import type { IndustryKey, PiiItem, Safeguard, TemplateId } from './types';

/* ================================================================== */
/*  개인정보 항목 카탈로그                                                 */
/*  출처: 개인정보보호법 제22조(수집 항목) / 제23조(민감정보)               */
/* ================================================================== */

export const PII_CATALOG: PiiItem[] = [
  // ── 기본식별정보 ──────────────────────────────────────────────
  { id: 'name', label: '성명', category: '기본식별정보' },
  { id: 'name_en', label: '영문명 / 한자명', category: '기본식별정보' },
  { id: 'nickname', label: '닉네임 / 이용자 아이디', category: '기본식별정보' },
  { id: 'passport', label: '여권번호', category: '기본식별정보' },
  { id: 'alien_no', label: '외국인등록번호', category: '기본식별정보' },
  { id: 'driver_license', label: '운전면허번호', category: '기본식별정보' },

  // ── 고유식별정보 ──────────────────────────────────────────────
  { id: 'rrn', label: '주민등록번호', category: '고유식별정보' },
  { id: 'ci', label: '본인확인값 (CI)', category: '고유식별정보' },
  { id: 'di', label: '개인 식별변환키 (DI)', category: '고유식별정보' },

  // ── 연락처 ────────────────────────────────────────────────────
  { id: 'mobile', label: '휴대전화번호', category: '연락처' },
  { id: 'tel', label: '집 전화번호', category: '연락처' },
  { id: 'email', label: '이메일 주소', category: '연락처' },
  { id: 'fax', label: '팩스번호', category: '연락처' },
  { id: 'parent_contact', label: '법정대리인(보호자) 연락처', category: '연락처' },

  // ── 금융정보 ──────────────────────────────────────────────────
  { id: 'card', label: '신용·체크카드번호 / 유효기간', category: '금융정보' },
  { id: 'bank_account', label: '은행계좌번호', category: '금융정보' },
  { id: 'payment_history', label: '결제·매출 내역', category: '금융정보' },
  { id: 'transaction', label: '금융거래 내역', category: '금융정보' },
  { id: 'credit_info', label: '신용정보', category: '금융정보' },
  { id: 'income', label: '소득 정보', category: '금융정보' },
  { id: 'property', label: '재산 정보 (부동산 · 보유자산)', category: '금융정보' },
  { id: 'family_relation', label: '가족관계 정보', category: '주소·생활정보' },

  // ── 주소 / 생활정보 ──────────────────────────────────────────
  { id: 'address', label: '자택 주소 / 상세주소', category: '주소·생활정보' },
  { id: 'office_address', label: '사업장 주소', category: '주소·생활정보' },
  { id: 'birth', label: '생년월일', category: '주소·생활정보' },
  { id: 'gender', label: '성별', category: '주소·생활정보' },
  { id: 'age_group', label: '연령대', category: '주소·생활정보' },
  { id: 'job', label: '직업 / 소속', category: '주소·생활정보' },
  { id: 'education', label: '학력 / 최종학력', category: '주소·생활정보' },
  { id: 'blood_type', label: '혈액형', category: '주소·생활정보' },

  // ── 고용 정보 ─────────────────────────────────────────────────
  { id: 'employment', label: '재직·고용 정보', category: '고용정보' },
  { id: 'salary', label: '임금·급여 정보', category: '고용정보' },
  { id: 'attendance', label: '출결·근태 기록', category: '고용정보' },
  { id: 'insurance', label: '건강보험 정보', category: '고용정보' },

  // ── 교육 정보 ─────────────────────────────────────────────────
  { id: 'school', label: '소속 학교 / 기관', category: '교육정보' },
  { id: 'student_no', label: '학번 · 학생번호', category: '교육정보' },
  { id: 'grade', label: '학년 · 반 · 성적', category: '교육정보' },

  // ── 민감정보 (법 제23조) ───────────────────────────────────────
  { id: 'health', label: '건강상태 · 질병 이력', category: '민감정보', sensitive: true },
  { id: 'medical_history', label: '진료 · 처치 이력', category: '민감정보', sensitive: true },
  { id: 'biometric', label: '생체정보 (지문 · 홍주 · 얼굴 · 음성)', category: '민감정보', sensitive: true },
  { id: 'belief', label: '사상 · 신념 · 종교', category: '민감정보', sensitive: true },
  { id: 'political', label: '정치적 견해 · 정당성향', category: '민감정보', sensitive: true },
  { id: 'criminal', label: '형사사건 · 유겁기록', category: '민감정보', sensitive: true },
  { id: 'sexual', label: '성적 기호 · 성생활', category: '민감정보', sensitive: true },

  // ── 위치정보 ──────────────────────────────────────────────────
  { id: 'location', label: '위치정보 (GPS · LBS)', category: '위치정보' },
  { id: 'move_pattern', label: '이동 경로 · 행동 패턴', category: '위치정보' },

  // ── 자동수집 정보 ─────────────────────────────────────────────
  { id: 'ip', label: 'IP 주소', category: '자동수집', autoCollected: true },
  { id: 'cookie', label: '쿠키 · 세션 식별자', category: '자동수집', autoCollected: true },
  { id: 'device', label: '기기 정보 (OS · 모델 · 화면크기)', category: '자동수집', autoCollected: true },
  { id: 'ad_id', label: '광고 식별자 (ADID)', category: '자동수집', autoCollected: true },
  { id: 'usage_log', label: '서비스 이용기록 (접속 · 검색 · 다운로드)', category: '자동수집', autoCollected: true },
  { id: 'marketing_consent', label: '광고·마케팅 수신동의 이력', category: '자동수집' },

  // ── 서비스 운영 정보 ──────────────────────────────────────────
  { id: 'company', label: '회사명 · 부서명 (B2B 가입자)', category: '서비스운영' },
  { id: 'business_no', label: '사업자등록번호', category: '서비스운영' },
  { id: 'contract', label: '계약·거래 내역', category: '서비스운영' },
  { id: 'cs_record', label: '고객 상담·문의 기록', category: '서비스운영' },
  { id: 'request_history', label: '주문 · 장바구니 이력', category: '서비스운영' },
  { id: 'coupon', label: '쿠폰 · 할인권 사용 이력', category: '서비스운영' },
  { id: 'upload_content', label: '게시 · 업로드한 콘텐츠', category: '서비스운영' },
];

export const PII_MAP: Record<string, PiiItem> = Object.fromEntries(
  PII_CATALOG.map((p) => [p.id, p]),
);

export const PII_CATEGORIES = Array.from(new Set(PII_CATALOG.map((p) => p.category)));

/** 민감정보(법 제23조) 취급 시 별도 동의 + 목록 공개 의무가 발생하는 항목 ID */
export const SENSITIVE_PII_IDS = PII_CATALOG.filter((p) => p.sensitive).map((p) => p.id);

/* ================================================================== */
/*  안전성 확보조치 카탈로그                                              */
/*  출처: 「개인정보의 안전성 확보조치 기준」 제3(기술적) 제4~6(관리적)     */
/*         제7(물리적)                                                  */
/* ================================================================== */

export const SAFEGUARD_CATALOG: Safeguard[] = [
  // ── 기술적 보호조치 (기준 제3조) ───────────────────────────────
  { id: 'access_control', label: '접근권한의 최소화 및 업무별 차등 부여 (최소권한 원칙)', category: '기술적', legalRef: '안전성확보조치기준 제3조 제1항' },
  { id: 'auth_strong', label: '사용자 인증 강화 (다중요소인증 MFA 적용)', category: '기술적', legalRef: '안전성확보조치기준 제3조 제1항' },
  { id: 'enc_db', label: '고유식별정보 · 비밀번호 AES-256 이상 암호화 저장', category: '기술적', legalRef: '안전성확보조치기준 제3조 제2항' },
  { id: 'enc_transit', label: '전송 구간 TLS(SSL) 암호화 및 보안 헤더 적용', category: '기술적', legalRef: '안전성확보조치기준 제3조 제2항' },
  { id: 'masking', label: '개인정보 마스킹 · 비노출 처리 및 화면 출력 통제', category: '기술적', legalRef: '안전성확보조치기준 제3조 제3항' },
  { id: 'log_retention', label: '접속기록 1년 이상 안전 보관 및 위·변조 방지', category: '기술적', legalRef: '안전성확보조치기준 제3조 제4항' },
  { id: 'antivirus', label: '백신·ransomware 방어 솔루션 설치 및 실시간 갱신', category: '기술적', legalRef: '안전성확보조치기준 제3조 제5항' },
  { id: 'patch', label: '보안 패치 및 취약점 관리 절차 수립·이행', category: '기술적', legalRef: '안전성확보조치기준 제3조 제5항' },
  { id: 'ips_waf', label: '침입방지시스템(IPS) · 웹방화벽(WAF) 운영', category: '기술적', legalRef: '안전성확보조치기준 제3조 제5항' },
  { id: 'dlp', label: '데이터 유출방지(DLP) 솔루션 도입 및 개인정보 반출 통제', category: '기술적', legalRef: '안전성확보조치기준 제3조 제6항' },
  { id: 'backup', label: '백업 수행 및 복구 가능성 검증 (복구 테스트)', category: '기술적', legalRef: '안전성확보조치기준 제3조 제8항' },
  { id: 'monitoring', label: '이상 접속 탐지 · 개인정보 유출 시위보안 모니터링', category: '기술적', legalRef: '안전성확보조치기준 제3조 제4항' },
  { id: 'pi_impact', label: '개인정보 영향평가(PIA) 실시 (대규모 · 고위험 정보처리)', category: '기술적', legalRef: '법 제36조' },

  // ── 관리적 보호조치 (기준 제4~6조) ─────────────────────────────
  { id: 'policy', label: '개인정보 보호방침 · 내부관리계획서 수립 및 CPO 승인', category: '관리적', legalRef: '법 제29조 · 제30조' },
  { id: 'cpo', label: '개인정보 보호책임자(CPO) 지정 및 정기 회의 운영', category: '관리적', legalRef: '법 제39조' },
  { id: 'contract', label: '개인정보 처리위탁 계약 및 제3자 제공 계약 체결', category: '관리적', legalRef: '법 제22조 제3항 · 제26조' },
  { id: 'supervisor', label: '개인정보 취급 업무 분장 · 수시 감독 조치', category: '관리적', legalRef: '안전성확보조치기준 제4조' },
  { id: 'training', label: '전 임직원 대상 개인정보보호 교육 연 1회 이상 실시', category: '관리적', legalRef: '안전성확보조치기준 제5조' },
  { id: 'pledge', label: '임직원 비밀유지 서약서 징구 및 보관', category: '관리적', legalRef: '안전성확보조치기준 제5조' },
  { id: 'list_management', label: '개인정보 처리대장 · 처리시스템 현황 문서화 관리', category: '관리적', legalRef: '안전성확보조치기준 제5조' },
  { id: 'consent_mgmt', label: '수집·이용 동의 관리 시스템 운영 (동의 철회 지원)', category: '관리적', legalRef: '법 제22조 · 제15조' },
  { id: 'regular_check', label: '개인정보 처리 현황 정기 점검(연 1회) 및 결과 보고서 작성', category: '관리적', legalRef: '안전성확보조치기준 제6조' },
  { id: 'incident_plan', label: '개인정보 유출 사고 대응 계획 수립 및 모의훈련', category: '관리적', legalRef: '법 제34조' },

  // ── 물리적 보호조치 (기준 제7조) ───────────────────────────────
  { id: 'server_room', label: '전산실 출입통제 · 잠금장치 및 감시카메라 설치', category: '물리적', legalRef: '안전성확보조치기준 제7조' },
  { id: 'doc_cabinet', label: '개인정보가 포함된 서류보관실 잠금 관리 및 출입 대장 관리', category: '물리적', legalRef: '안전성확보조치기준 제7조' },
  { id: 'disposal_bin', label: '폐기물 임시보관 용기 설치 및 주기적 소각·파쇄', category: '물리적', legalRef: '안전성확보조치기준 제7조' },
  { id: 'workstation', label: '개인정보가 저장된 단말기 도난·분실 방지 조치', category: '물리적', legalRef: '안전성확보조치기준 제7조' },
];

export const SAFEGUARD_MAP: Record<string, Safeguard> = Object.fromEntries(
  SAFEGUARD_CATALOG.map((s) => [s.id, s]),
);

/* ================================================================== */
/*  업종 프리셋                                                          */
/*  규모·업종에 따라 수집 항목 · 보호조치 · 위탁/제공 항목이 자동 구성됩니다.   */
/* ================================================================== */

export interface IndustryPreset {
  key: IndustryKey;
  label: string;
  emoji: string;
  description: string;
  defaultPiiIds: string[];
  extraPiiIds: string[];
  defaultSafeguardIds: string[];
  extraSafeguardIds: string[];
  services: string[];
  purposes: string[];
  entrustedSeed: { entity: string; purpose: string; items: string; period: string }[];
  thirdPartySeed: { entity: string; purpose: string; items: string; method: string }[];
  overseasSeed?: { country: string; entity: string; items: string; purpose: string; method: string }[];
  note: string;
}

export const INDUSTRY_PRESETS: Record<IndustryKey, IndustryPreset> = {
  generic: {
    key: 'generic',
    label: '일반 기업 / 기관',
    emoji: '🏢',
    description: '업종을 특정하지 않는 기본 프리셋입니다. 어떤 형태의 조직에도 안전하게 적용됩니다.',
    defaultPiiIds: ['name', 'mobile', 'email', 'ip', 'usage_log'],
    extraPiiIds: ['address', 'birth', 'gender', 'ci'],
    defaultSafeguardIds: [
      'access_control', 'enc_db', 'enc_transit', 'log_retention', 'antivirus',
      'policy', 'cpo', 'contract', 'training', 'regular_check', 'server_room',
    ],
    extraSafeguardIds: ['auth_strong', 'dlp', 'incident_plan', 'pi_impact', 'backup'],
    services: ['공식 홈페이지 및 웹서비스', '고객센터(민원 접수)'],
    purposes: [
      '회원 가입 및 식별',
      '이용약관 및 개인정보 처리방침 고지',
      '계약·거래 및 서비스 제공',
      '고객 문의 대응 및 민원 처리',
    ],
    entrustedSeed: [
      { entity: '클라우드 호스팅 사업자', purpose: '서버 인프라 운영 및 데이터 보관', items: '회원 식별정보, 서비스 이용기록', period: '계약 기간 중, 계약 해지 후 1년' },
      { entity: '문자·알림톡 발송 사업자', purpose: '알림 메시지 발송', items: '휴대전화번호', period: '발송 완료 후 6개월' },
    ],
    thirdPartySeed: [
      { entity: '정산·대행 사업자', purpose: '대금 결제 및 정산 처리', items: '거래 정보', method: '안전한 전송 수단' },
    ],
    note: '모든 기업·기관에 공통으로 적용되는 기본 항목입니다.',
  },

  ecommerce: {
    key: 'ecommerce',
    label: '쇼핑몰 · 전자상거래',
    emoji: '🛒',
    description: '주문·결제·배송 전체 흐름을 반영한 프리셋입니다. 통신판매업 정보무 보고 대상 업종입니다.',
    defaultPiiIds: [
      'name', 'mobile', 'email', 'address', 'rrn', 'card', 'bank_account',
      'payment_history', 'contract', 'cs_record', 'cookie', 'ip', 'usage_log',
    ],
    extraPiiIds: ['birth', 'request_history', 'coupon', 'ci', 'di', 'marketing_consent'],
    defaultSafeguardIds: [
      'access_control', 'auth_strong', 'enc_db', 'enc_transit', 'masking',
      'log_retention', 'antivirus', 'patch', 'ips_waf', 'dlp', 'backup',
      'policy', 'cpo', 'contract', 'supervisor', 'training', 'consent_mgmt',
      'regular_check', 'incident_plan', 'server_room', 'doc_cabinet',
    ],
    extraSafeguardIds: ['pi_impact', 'pledge', 'list_management'],
    services: [
      '온라인 쇼핑몰 (상품 판매)',
      '회원가입 및 멤버십 관리',
      '주문·결제·정산 시스템',
      '적립금·쿠폰 프로모션',
      '고객센터 및 반품 처리',
    ],
    purposes: [
      '회원 가입 및 회원 정보 관리',
      '상품 주문·결제·배송 및 정산',
      '반품·교환 및 A/S 처리',
      '재구매 알림 및 프로모션 정보 제공',
      '고객 문의 대응 및 분쟁 조율',
    ],
    entrustedSeed: [
      { entity: 'PG사 (결제대행사)', purpose: '결제 승인 및 정산 처리', items: '카드번호, 주문 정보, 결제금액', period: '정산 완료 후 5년 (전자상거래법)' },
      { entity: '택배·물류 사업자', purpose: '상품 배송', items: '수취인 성명, 연락처, 주소', period: '배송 완료 후 6개월' },
      { entity: '클라우드 호스팅 사업자', purpose: '쇼핑몰 인프라 운영', items: '회원 정보, 주문 정보', period: '계약 기간 중' },
      { entity: '문자·알림톡 발송 사업자', purpose: '주문·배송 알림 발송', items: '휴대전화번호', period: '발송 후 6개월' },
      { entity: '고객상담 외주 업체', purpose: '고객 문의 응대', items: '성명, 연락처, 문의 내용', period: '계약 기간 중' },
    ],
    thirdPartySeed: [
      { entity: '통신판매업자(플랫폼)', purpose: '거래 중개 및 정산', items: '판매자 정보', method: '안전한 전송 수단' },
    ],
    note: '통신사업자·통신판매업자 정보통신망법상 의무보고(연 1회)와 위탁자 실태조사가 필요한 업종입니다.',
  },

  'it-saas': {
    key: 'it-saas',
    label: 'IT · SaaS · 클라우드',
    emoji: '☁️',
    description: '테넌트 격리, API 접근통제, 클라우드 리전 국외이전이 핵심 쟁점인 프리셋입니다.',
    defaultPiiIds: [
      'name', 'email', 'mobile', 'company', 'business_no', 'ip', 'cookie',
      'device', 'usage_log', 'contract', 'ad_id', 'job', 'ci',
    ],
    extraPiiIds: ['location', 'marketing_consent', 'education', 'birth'],
    defaultSafeguardIds: [
      'access_control', 'auth_strong', 'enc_db', 'enc_transit', 'masking',
      'log_retention', 'antivirus', 'patch', 'ips_waf', 'dlp', 'backup',
      'monitoring', 'pi_impact', 'policy', 'cpo', 'contract', 'supervisor',
      'training', 'pledge', 'list_management', 'consent_mgmt', 'regular_check',
      'incident_plan', 'server_room',
    ],
    extraSafeguardIds: ['workstation', 'disposal_bin'],
    services: [
      'SaaS 서비스 플랫폼',
      '개발자 API 및 웹훅',
      '관리자 콘솔',
      '구독·결제 시스템',
      '기술지원 티켓 시스템',
    ],
    purposes: [
      '서비스 계정 생성 및 본인인증',
      'SaaS 기능 제공 및 성능 최적화',
      '이용 요금 산정 및 청구',
      '장애·오류 모니터링 및 서비스 개선',
      '기술지원 및 보안 알림 발송',
    ],
    entrustedSeed: [
      { entity: '클라우드 인프라 사업자', purpose: '서버 및 데이터베이스 운영', items: '전체 회원 개인정보', period: '계약 기간 중' },
      { entity: '이메일 발송 사업자', purpose: 'Transactional 이메일 발송', items: '이메일 주소, 성명', period: '발송 후 6개월' },
      { entity: '모니터링·관측성 사업자', purpose: '서비스 성능 및 장애 모니터링', items: 'IP 주소, 기기 정보, 오류 로그', period: '수집 후 13개월' },
    ],
    thirdPartySeed: [
      { entity: '본인인증 사업자 (CI/DI)', purpose: '회원 가입 본인인증', items: 'CI / DI', method: '암호화된 전송' },
      { entity: '결제 사업자', purpose: '구독 요금 결제', items: '카드 정보', method: '토큰화 (PCI DSS 준수)' },
    ],
    overseasSeed: [
      { country: '미국', entity: '클라우드 리전 사업자', items: '회원 성명, 이메일 주소, 서비스 이용기록', purpose: '서비스 운영 및 장애 복구', method: '암호화 전송, 저장 데이터 암호화' },
    ],
    note: '해외 클라우드 리전 사용 시 국외이전 동의 절차와 「개인정보의 국외이전 안내서」 배포가 필요합니다.',
  },

  healthcare: {
    key: 'healthcare',
    label: '의료 · 병원 ·의원',
    emoji: '🏥',
    description: '건강정보는 민감정보에 해당하며 별도 동의가 필요한 업종입니다.',
    defaultPiiIds: [
      'name', 'rrn', 'mobile', 'address', 'birth', 'gender', 'health',
      'medical_history', 'contract', 'insurance', 'employment',
    ],
    extraPiiIds: ['biometric', 'blood_type', 'family_relation', 'ci'],
    defaultSafeguardIds: [
      'access_control', 'auth_strong', 'enc_db', 'enc_transit', 'masking',
      'log_retention', 'antivirus', 'patch', 'ips_waf', 'dlp', 'backup',
      'monitoring', 'pi_impact', 'policy', 'cpo', 'contract', 'supervisor',
      'training', 'pledge', 'list_management', 'consent_mgmt', 'regular_check',
      'incident_plan', 'server_room', 'doc_cabinet', 'workstation',
    ],
    extraSafeguardIds: ['disposal_bin'],
    services: ['진료 예약 및 접수', '전자차트(EMR) 관리', '처방·투약 관리', '보험 청구', '환자 포털'],
    purposes: [
      '환자 등록 및 진료 예약',
      '진료·치료 및 처치 기록',
      '처방전 발급 및 약품 관리',
      '의료비 및 건강보험 청구·정산',
      '안전한 진료와 의료비 지원',
    ],
    entrustedSeed: [
      { entity: 'HIS/EMR 시스템 공급·운영 업체', purpose: '전자차트 저장 및 관리', items: '환자 성명, 주민등록번호, 진단명, 처치 내역', period: '의료법상 기록 보관기간' },
      { entity: '외부 검사실', purpose: '검사 의뢰', items: '환자 성명, 성별, 나이, 검체 정보', period: '검사 완료 후 5년' },
      { entity: '처방정보 전산 지원 사업자', purpose: '처방 검증 및 조제 관리', items: '환자 성명, 처방 내역', period: '조제 완료 후 1년' },
    ],
    thirdPartySeed: [
      { entity: '건강보험심사평가원', purpose: '의료급여 청구 심사', items: '환자 식별정보, 진료 내역', method: '전산 제출(암호화)' },
    ],
    note: '건강·진단 정보는 민감정보로, 별도 동의 및 벽치유지 의무가 발생합니다.',
  },

  education: {
    key: 'education',
    label: '교육 · 학원 · 학교',
    emoji: '🎓',
    description: '미성년자(학생) 정보와 법정대리인 동의가 주요 쟁점인 프리셋입니다.',
    defaultPiiIds: [
      'name', 'birth', 'gender', 'address', 'mobile', 'email',
      'school', 'grade', 'attendance', 'education', 'parent_contact', 'contract',
    ],
    extraPiiIds: ['health', 'student_no', 'family_relation', 'device', 'usage_log'],
    defaultSafeguardIds: [
      'access_control', 'auth_strong', 'enc_db', 'enc_transit', 'masking',
      'log_retention', 'antivirus', 'backup', 'policy', 'cpo', 'contract',
      'supervisor', 'training', 'pledge', 'list_management', 'consent_mgmt',
      'regular_check', 'incident_plan', 'server_room', 'doc_cabinet', 'workstation',
    ],
    extraSafeguardIds: ['patch', 'monitoring'],
    services: ['수강 신청 및 수강료 납부', '출결·성적 관리', '학원생활 알림', '학부모 상담 기록'],
    purposes: [
      '수강생 등록 및 수업 운영',
      '출결 및 성적·평가 관리',
      '수강료 청구 및 현금영수증 발급',
      '학부모 상담 및 생활 안내',
      '학교생활 안전 관리',
    ],
    entrustedSeed: [
      { entity: '학원 관리 플랫폼 사업자', purpose: '출결·수납 관리', items: '수강생 성명, 연락처, 출결 정보', period: '계약 기간 중' },
      { entity: '이메일·문자 발송 사업자', purpose: '공지 및 출결 알림', items: '연락처', period: '발송 후 6개월' },
    ],
    thirdPartySeed: [
      { entity: '교육청 · 학적기관', purpose: '학적 신고 및 성적 관리', items: '학생 성명, 학년, 학교 정보', method: '공문·시스템' },
    ],
    note: '학생(미성년자) 정보는 법정대리인의 동의를, 구반 처리 항목은 별도의 동의를 받아야 합니다.',
  },

  finance: {
    key: 'finance',
    label: '금융 · 핀테크',
    emoji: '🏦',
    description: '전자금융거래법 및 금융위 감독 기준이 함께 적용되는 프리셋입니다.',
    defaultPiiIds: [
      'name', 'rrn', 'mobile', 'email', 'bank_account', 'card',
      'credit_info', 'transaction', 'income', 'employment', 'salary',
    ],
    extraPiiIds: ['property', 'family_relation', 'education', 'ad_id'],
    defaultSafeguardIds: [
      'access_control', 'auth_strong', 'enc_db', 'enc_transit', 'masking',
      'log_retention', 'antivirus', 'patch', 'ips_waf', 'dlp', 'backup',
      'monitoring', 'pi_impact', 'policy', 'cpo', 'contract', 'supervisor',
      'training', 'pledge', 'list_management', 'consent_mgmt', 'regular_check',
      'incident_plan', 'server_room', 'doc_cabinet',
    ],
    extraSafeguardIds: ['workstation', 'disposal_bin'],
    services: ['계정 개설 및 본인인증', '금융 거래 처리', '지급·결제 서비스', '금융 상담'],
    purposes: [
      '금융 거래 체결 및 결제 처리',
      '고객 본인인증 및 신원 확인',
      '자금세탁방지(AML) 준법감시',
      '금융 상담 및 정보 제공',
      '전자금융 관련 법정 보고',
    ],
    entrustedSeed: [
      { entity: '결제대행사 · 뱅킹 제휴사', purpose: '지급결제 대행 처리', items: '계좌번호, 거래 정보', period: '거래 후 5년' },
      { entity: '전산시설 운영 사업자', purpose: '코어 banking 시스템 운영', items: '계좌 기반 식별정보', period: '계약 기간 중' },
    ],
    thirdPartySeed: [
      { entity: '신용정보회사', purpose: '신용 조회', items: '성명, 주민등록번호', method: '보안 전송' },
      { entity: '금융감독원', purpose: '감독 자료 제출', items: '보고 대상 정보', method: '전산 제출' },
    ],
    note: '금융거래 기록은 전자금융거래법에 따라 5년 보존 의무가 적용됩니다.',
  },

  logistics: {
    key: 'logistics',
    label: '물류 · 배송 · 콜택시',
    emoji: '🚚',
    description: '상세주소와 차량 위치정보의 민감도가 높은 프리셋입니다.',
    defaultPiiIds: ['name', 'mobile', 'address', 'office_address', 'usage_log', 'contract', 'device'],
    extraPiiIds: ['location', 'move_pattern', 'ci', 'employment'],
    defaultSafeguardIds: [
      'access_control', 'auth_strong', 'enc_db', 'enc_transit', 'log_retention',
      'antivirus', 'patch', 'monitoring', 'policy', 'cpo', 'contract',
      'training', 'consent_mgmt', 'regular_check', 'incident_plan', 'server_room',
    ],
    extraSafeguardIds: ['dlp', 'backup', 'ips_waf'],
    services: ['배송 예약 · 배차', '화물 운송', '운송장 관리', '배달 현황 알림'],
    purposes: [
      '배송 예약 및 배차 수행',
      '화물·소포 운송 및 배송완료 통지',
      '이용 요금 정산 및 영수증 발급',
      '배송 통계 분석 및 서비스 개선',
    ],
    entrustedSeed: [
      { entity: '하청 물류·배송 업체', purpose: '지하 위탁 배송 수행', items: '수취인 성명, 연락처, 주소', period: '배송 완료 후 1년' },
      { entity: '문자 발송 사업자', purpose: '배달 현황 알림', items: '휴대전화번호', period: '발송 후 6개월' },
    ],
    thirdPartySeed: [],
    note: '하청 위탁 시 수탁자 현황 대장과 정기 실태조사 절차도 함께 문서화해야 합니다.',
  },

  manufacturing: {
    key: 'manufacturing',
    label: '제조 · 생산',
    emoji: '🏭',
    description: '근로자 개인정보(근태·임금·안전보건) 비중이 높은 프리셋입니다.',
    defaultPiiIds: ['name', 'rrn', 'mobile', 'address', 'bank_account', 'attendance', 'employment', 'salary', 'health'],
    extraPiiIds: ['biometric', 'device', 'location'],
    defaultSafeguardIds: [
      'access_control', 'auth_strong', 'enc_db', 'enc_transit', 'log_retention',
      'antivirus', 'patch', 'backup', 'policy', 'cpo', 'contract', 'training',
      'pledge', 'regular_check', 'incident_plan', 'server_room', 'doc_cabinet',
      'workstation', 'disposal_bin',
    ],
    extraSafeguardIds: ['monitoring', 'ips_waf'],
    services: ['사원 관리 및 근태', '임금·급여 정산', '자재·생산 관리', '안전보건 관리'],
    purposes: [
      '근로자 입퇴사 및 인사·급여 관리',
      '근태 및 근로시간 관리',
      '안전보건 교육 및 재해 예방',
      '생산·품질 관리 및 법정 보고',
    ],
    entrustedSeed: [
      { entity: '급여대행 사업자', purpose: '임금 지급 대행', items: '사원 성명, 계좌번호, 주민등록번호', period: '지급 후 5년' },
      { entity: '산업안전보건 지원 사업자', purpose: '건강진단 지원', items: '근로자 성명, 건강 정보', period: '진단 후 5년' },
    ],
    thirdPartySeed: [
      { entity: '근로복지공단', purpose: '사회보험 신고', items: '근로자 성명, 주민등록번호', method: '전산 제출' },
    ],
    note: '근로자의 건강진단 결과는 민감정보이므로 별도 보관 및 접근통제가 필요합니다.',
  },

  marketing: {
    key: 'marketing',
    label: '마케팅 · 광고',
    emoji: '📣',
    description: '광고성 정보 수신 동의 관리와 정보통신망법상 대량 전송 기준이 핵심입니다.',
    defaultPiiIds: ['name', 'mobile', 'email', 'ad_id', 'cookie', 'usage_log', 'marketing_consent'],
    extraPiiIds: ['age_group', 'ip', 'location', 'device'],
    defaultSafeguardIds: [
      'access_control', 'enc_db', 'enc_transit', 'log_retention', 'antivirus',
      'policy', 'cpo', 'contract', 'training', 'consent_mgmt', 'regular_check',
      'incident_plan',
    ],
    extraSafeguardIds: ['dlp', 'monitoring', 'pi_impact', 'masking'],
    services: ['캠페인 관리', '광고 타겟팅 및 리타겟팅', '콘텐츠·이메일 배포', '광고 성과 분석'],
    purposes: [
      '캠페인 대상자 선정 및 광고 게재',
      '광고·혜택 정보 발송',
      '광고 성과 측정 및 최적화',
      '고객 유지 및 재활성화',
    ],
    entrustedSeed: [
      { entity: '광고 플랫폼(DMP) 사업자', purpose: '오디언스 매칭', items: '광고 식별자, 기기 정보', period: '매칭 후 6개월' },
      { entity: '대량 메시지 발송 사업자', purpose: '이메일·SMS 발송', items: '연락처, 성명', period: '발송 후 6개월' },
    ],
    thirdPartySeed: [
      { entity: '광고 매체사', purpose: '광고 게재', items: '광고 식별자', method: '쿠키 / SDK' },
    ],
    note: '광고성 정보는 별도 동의를 받아야 하며, 수신 거부 시 즉시 발송을 중단해야 합니다.',
  },

  media: {
    key: 'media',
    label: '미디어 · 콘텐츠 · 커뮤니티',
    emoji: '🎬',
    description: '게시물·댓글에 포함된 타인의 개인정보 기재 관리가 핵심입니다.',
    defaultPiiIds: ['name', 'nickname', 'email', 'mobile', 'ip', 'usage_log', 'cookie', 'upload_content'],
    extraPiiIds: ['birth', 'location', 'payment_history', 'ad_id'],
    defaultSafeguardIds: [
      'access_control', 'auth_strong', 'enc_db', 'enc_transit', 'log_retention',
      'antivirus', 'patch', 'monitoring', 'policy', 'cpo', 'contract', 'training',
      'consent_mgmt', 'regular_check', 'incident_plan', 'server_room',
    ],
    extraSafeguardIds: ['dlp', 'masking', 'pledge'],
    services: ['콘텐츠 등록·게시', '댓글·커뮤니티 운영', '구독·결제', '추천·이메일 알림'],
    purposes: [
      '회원 가입 및 콘텐츠 게시',
      '댓글·커뮤니티 서비스 제공',
      '구독 및 결제 처리',
      '불량 콘텐츠 관리 및 신고 대응',
    ],
    entrustedSeed: [
      { entity: 'CDN·클라우드 사업자', purpose: '콘텐츠 저장 및 배포', items: '게시물, IP 주소', period: '계약 기간 중' },
      { entity: '결제 대행사', purpose: '구독 결제 처리', items: '카드 정보, 결제 내역', period: '정산 후 5년' },
    ],
    thirdPartySeed: [
      { entity: '광고 사업자', purpose: '광고 게재 및 수익화', items: '광고 식별자, 이용기록', method: 'SDK / 쿠키' },
    ],
    note: '타인의 개인정보가 게시물에 포함될 경우 즉시 비공개·삭제할 수 있는 절차가 필요합니다.',
  },
};

/* ================================================================== */
/*  문서 유형 메타데이터                                                   */
/* ================================================================== */

export interface TemplateMeta {
  id: TemplateId;
  title: string;
  subtitle: string;
  category: string;
  legalRef: string;
  icon: string;
  audience: string;
  description: string;
  required: boolean;
  group: string;
  color: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose';
}

export const TEMPLATE_META: TemplateMeta[] = [
  {
    id: 'privacy-policy',
    title: '개인정보 처리방침',
    subtitle: 'Privacy Policy',
    category: '대외 공개',
    legalRef: '법 제30조 · 시행령 제32조',
    icon: 'scroll-text',
    audience: '정보주체(고객 · 회원 · 사용자)',
    description:
      '홈페이지·앱에 공개해야 하는 법정 필수 문서입니다. 처리 목적, 보유기간, 제3자 제공, 국외이전, 권리 행사 절차 등 필수 기재 항목을 모두 포함합니다.',
    required: true,
    group: '대외 공개 문서',
    color: 'indigo',
  },
  {
    id: 'internal-plan',
    title: '개인정보 내부관리계획서',
    subtitle: 'Internal Management Plan',
    category: '내부 규정',
    legalRef: '법 제29조 · 시행령 제30조 · 안전성 확보조치 기준',
    icon: 'shield-check',
    audience: '임직원 · 감사 · 개인정보보호위원회',
    description:
      '기술적·관리적·물리적 보호조치와 CPO 권한, 정기 점검, 수탁자 관리를 규정하는 ISMS-P 심사 필수 서식입니다.',
    required: true,
    group: '내부 규정 문서',
    color: 'emerald',
  },
  {
    id: 'security-guideline',
    title: '임직원 개인정보 보호지침',
    subtitle: 'Employee Privacy Guidelines',
    category: '사내 지침',
    legalRef: '법 제28조 · 안전성 확보조치 기준 제5조',
    icon: 'user-check',
    audience: '전 임직원 · 개인정보 취급자',
    description:
      '취급자 비밀유지 의무, 업무용 단말기 보안, 개인정보 취급 단계별 수칙, 위반 시 징계 기준을 규정하는 교육용 지침입니다.',
    required: true,
    group: '사내 운영 문서',
    color: 'amber',
  },
  {
    id: 'outsource-agreement',
    title: '개인정보 처리위탁 계약서',
    subtitle: 'Data Processing Outsourcing Agreement',
    category: '계약 서식',
    legalRef: '법 제22조 제3항 · 제26조 · 시행령 제23조',
    icon: 'file-signature',
    audience: '위탁 수탁자',
    description:
      'PG사, 클라우드, CS 외주 등 개인정보 처리 위탁 시 체결해야 하는 표준 계약서입니다. 재위탁 제한, 안전성 확보, 감사권까지 규정합니다.',
    required: false,
    group: '계약 · 증빙 서식',
    color: 'sky',
  },
  {
    id: 'breach-manual',
    title: '개인정보 유출 사고 대응 매뉴얼',
    subtitle: 'Data Breach Response Manual',
    category: '위기 대응',
    legalRef: '법 제34조 · 시행령 제72조 (72시간 이내 신고)',
    icon: 'siren',
    audience: '비상대책반 · 전 임직원',
    description:
      '유출 발생 시 72시간 이내 개인정보보호위원회 신고와 정보주체 개별 통지, 재발 방지를 위한 단계별 대응 매뉴얼입니다.',
    required: true,
    group: '사내 운영 문서',
    color: 'rose',
  },
];

export const TEMPLATE_MAP: Record<TemplateId, TemplateMeta> = Object.fromEntries(
  TEMPLATE_META.map((t) => [t.id, t]),
) as Record<TemplateId, TemplateMeta>;
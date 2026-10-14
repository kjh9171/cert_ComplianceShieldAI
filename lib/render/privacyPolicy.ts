import { formatKoreanDate } from '../state';
import type { Block, DocState } from '../types';
import {
  autoCollectedPii,
  boilerplateNoteBlocks,
  docMetaRows,
  industryLabel,
  industryNote,
  legalBasisList,
  officerRows,
  officerText,
  orgFull,
  orgMetaRows,
  orgShort,
  piiByCategory,
  piiString,
  safeguardsByCategory,
  sensitivePii,
} from './helpers';

const P = (text: string): Block => ({ kind: 'paragraph', text });
const H = (num: string, text: string): Block => ({
  kind: 'heading',
  level: 2,
  num,
  text,
});
const C = (text: string): Block => ({ kind: 'heading', level: 1, text });

/**
 * 개인정보 처리방침
 * 「개인정보 보호법」 제30조 · 같은 법 시행령 제32조에 따라
 * 법정 기재 항목을 모두 포함합니다.
 */
export function buildPrivacyPolicy(state: DocState): Block[] {
  const o = state.org;
  const p = state.processing;
  const name = orgFull(state);
  const short = orgShort(state);
  const sec = safeguardsByCategory(state);
  const byCat = piiByCategory(state);

  const thirdPartyRows = p.thirdParties.map((t, i) => [
    `${i + 1}`,
    t.entity,
    t.purpose,
    t.items,
    t.method,
    t.legalBasis,
  ]);

  const entrustedRows = p.entrusted.map((e, i) => [
    `${i + 1}`,
    e.entity,
    e.purpose,
    e.items,
    e.period,
  ]);

  const overseasRows = p.overseas.map((t, i) => [
    `${i + 1}`,
    t.country,
    t.entity,
    `${t.purpose} / ${t.items}`,
    t.method,
  ]);

  const retentionRows = p.retentionRules.map((r, i) => [
    `${i + 1}`,
    r.item,
    r.period,
    r.basis,
  ]);

  const sensitive = sensitivePii(state);
  const autoCollected = autoCollectedPii(state);

  const secList = (key: '기술적' | '관리적' | '물리적'): Block =>
    sec[key].length
      ? { kind: 'list', items: sec[key] }
      : P(`아직 ${key} 보호조치가 등록되지 않았습니다. 대시보드에서 보호조치를 선택해 주세요.`);

  return [
    { kind: 'title', text: `${name} 개인정보 처리방침`, subtitle: `${o.docNumber} · ${o.version}` },
    { kind: 'meta', rows: docMetaRows(state) },

    P(
      `${name}(이하 “${short}”라 한다)은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고, 개인정보와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립하고 공개합니다.`,
    ),

    C('제1장 총칙'),

    H('제1조', '(목적)'),
    P(
      `본 처리방침은 ${name}이(가) 처리하는 모든 개인정보에 대하여 「개인정보 보호법」 및 관계 법령의 요구사항을 준수하고 정보주체의 권리를 보호하기 위하여 개인정보의 처리 및 보호에 관한 사항을 정하는 것을 목적으로 합니다.`,
    ),

    H('제2조', '(정의)'),
    {
      kind: 'list',
      items: [
        '이 처리방침에서 “개인정보”란 살아 있는 개인에 관한 정보로서 성명, 주민등록번호 등을 대하여 개인을 알아볼 수 있는 정보 및 「개인정보 보호법」 제2조 제1호가 정하는 정보를 말합니다.',
        '이 처리방침에서 “처리”란 개인정보의 수집, 이용, 생성, 제공, 공개, 전달, 제3자 제공, 국외이전 그 밖에 이용 또는 위탁에 관한 모든 행위를 말합니다.',
        '이 처리방침에서 “정보주체”란 개인정보 처리자로부터 개인정보에 대한 열람, 정정, 삭제, 처리정지 또는 동의 철회 권리를 행사할 수 있는 주체를 말합니다.',
        '이 처리방침에서 사용하는 용어의 뜻은 본문에 별도 정의가 있으면 그 정의에 따르고, 없으면 관련 법령 및 「개인정보 보호법 시행령」이 정하는 바에 따릅니다.',
      ],
    },

    C('제2장 개인정보의 처리'),

    H('제3조', '(개인정보의 처리 및 보유, 이용 기간)'),
    P(
      '① 회사는 법령에 따른 개인정보의 보유, 이용기간 또는 정보주체가 동의한 기간 내에서만 개인정보를 처리, 보유, 이용합니다.',
    ),
    {
      kind: 'table',
      head: ['No.', '보유 항목', '보유, 이용 기간', '법적 근거'],
      rows: retentionRows,
      widths: [6, 30, 30, 34],
    },
    P(
      '② 관계 법령의 위반을 이유로 수사 또는 조사가 진행 중인 경우에는 해당 수사 또는 조사가 종료될 때까지 개인정보를 보관합니다.',
    ),
    P(
      `③ 위 기간 외에 개인정보 보관이 불가피한 사유가 발생한 경우, ${name}은 관련 법령이 허용하는 범위에서 최단 기간으로 추가 보관하고 그 사실을 정보주체에게 고지합니다.`,
    ),

    H('제4조', '(수집하는 개인정보의 항목 및 수집 방법)'),
    P(`① ${name}은 다음과 같이 개인정보를 수집합니다. 수집 항목은 서비스 운영에 따라 증감될 수 있습니다.`),
    {
      kind: 'table',
      head: ['구분', '수집 항목'],
      rows: Object.entries(byCat).map(([cat, items]) => [cat, items.join(', ')]),
      widths: [24, 76],
    },
    P('② 개인정보의 수집 방법은 다음 각 호와 같다.'),
    {
      kind: 'list',
      ordered: true,
      items: [
        '홈페이지 및 모바일 앱의 회원가입 화면 등 정보주체가 직접 입력하는 방식',
        '전화 상담, 대면 상담, 문의 게시판 등을 통한 수집',
        '본인인증 절차(주요 식별정보로 확인)를 통한 수집',
        '서비스 이용 과정에서 자동으로 수집되는 기술적 정보',
      ],
    },
    P(
      `③ 자동 수집되는 정보는 ${autoCollected.length ? autoCollected.join(', ') : '별도 수집 항목 없음'}이며, 서비스 제공과 보안 관리 목적으로만 이용합니다.`,
    ),

    H('제5조', '(개인정보의 처리 목적)'),
    P(
      `${name}은 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 아래 목적 이외의 용도로 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.`,
    ),
    { kind: 'list', ordered: true, items: p.purposes },
    P(`② 위 목적을 위해 ${name}은 다음의 정보처리시스템을 운영합니다.`),
    { kind: 'list', items: p.services },
    P('③ 개인정보의 수집 및 이용 근거는 다음과 같습니다.'),
    { kind: 'list', ordered: true, items: legalBasisList(state) },

    H('제6조', '(민감정보의 처리)'),
    sensitive.length === 0
      ? P(
          `${name}은 법 제23조에 해당하는 민감정보를 수집하거나 이용하지 않습니다. 민감정보 처리가 불가피한 서비스가 추가되는 경우에는 「민감정보의 안전성 확보방안」에 따라 별도의 동의를 받고, 최소한의 기간만 보관합니다.`,
        )
      : P(
          `${name}은 법 제23조에 따라 다음의 민감정보를 수집하고 이용합니다. 별도의 동의를 받지 아니하면 수집하거나 이용하지 않으며, 「민감정보의 안전성 확보방안」에 따라 최소한의 기간만 보관합니다.`,
        ),

    H('제7조', '(자동화된 결정 및 프로파일링)'),
    P(p.automatedDecision),
    {
      kind: 'list',
      items: [
        '① 자동화된 결정에 대해 거부하거나 설명을 요구할 수 있으며, 요구 방법은 아래 제20조의 연락처를 이용합니다.',
        '② 자동화된 결정으로 중요한 결정이 이루어진 경우, 「개인정보 보호법」 제34조 및 관련 절차에 따라 설명 및 재검토를 요구할 수 있습니다.',
      ],
    },

    C('제3장 개인정보의 제3자 제공 및 위탁'),

    H('제8조', '(제3자 제공에 관한 사항)'),
    P(
      `① ${name}은 법 제22조 제3항 및 제34조에 따라 정보주체의 동의를 받아 다음의 제3자에게 개인정보를 제공할 수 있습니다.`,
    ),
    thirdPartyRows.length === 0
      ? P('  현재 제3자 제공이 이루어지는 항목은 없습니다. 추가되는 경우 본 처리방침을 갱신합니다.')
      : {
          kind: 'table',
          head: ['No.', '제공받는 자', '제공 목적', '제공 항목', '제공 방법', '동의 근거'],
          rows: thirdPartyRows,
          widths: [5, 18, 22, 22, 16, 17],
        },
    {
      kind: 'list',
      items: [
        '① 제공받은 자는 제공받은 목적의 범위에서만 개인정보를 처리해야 하며, 그 밖의 용도로 이용하거나 재제공할 수 없습니다.',
        '② 제공받은 자는 처리 목적이 달성되면 회사의 삭제 지시에 따라 개인정보를 파기하고 그 사실을 회사에 보고해야 합니다.',
        '③ 회사는 제공받은 자의 처리 활동을 정기적으로 지도하고 감독합니다. 위반 사항을 발견하면 즉시 시정을 요구하고, 시정되지 않을 경우 제공을 중단할 수 있습니다.',
        '④ 개인정보를 제3자에게 제공할 경우에는 「개인정보 보호법」 제25조에 따라 대가를 검증합니다.',
      ],
    },
    { kind: 'note', tone: 'info', title: '제3자 제공 대가 검증 절차', text: p.valueVerificationPolicy },

    H('제9조', '(개인정보의 처리 위탁에 관한 사항)'),
    P(`① ${name}은 서비스 제공에 필요한 범위에서 개인정보 처리를 위탁할 수 있으며, 위탁 시 「개인정보 처리위탁 계약서」를 체결합니다.`),
    {
      kind: 'table',
      head: ['No.', '수탁자', '위탁 목적', '처리 항목', '위탁 기간'],
      rows: entrustedRows,
      widths: [5, 22, 25, 28, 20],
    },
    {
      kind: 'list',
      items: [
        '① 회사는 수탁자가 개인정보를 부적절하게 처리한다고 판단되는 경우 계약 해지 또는 위탁 업무 중지를 요구할 수 있습니다.',
        '② 수탁자는 회사의 사전 서면 동의 없이는 위탁 업무를 제3자에게 재위탁할 수 없습니다.',
        '③ 회사는 수탁자의 귀책 사유로 개인정보가 유출된 경우 수탁자에 대한 손해배상 청구 등 필요한 조치를 취할 수 있습니다.',
        `④ 수탁자 관리 절차: ${p.entrustedAuditCycle}`,
      ],
    },

    H('제10조', '(개인정보의 국외이전에 관한 사항)'),
    P(
      `① ${name}은 원칙적으로 정보주체의 개인정보를 국외로 이동하지 않습니다. 서비스 제공을 위해 국외이전이 불가피한 경우에는 「개인정보 보호법」 제28조 및 「개인정보의 국외이전 표준계약」에 따라 별도의 동의를 받고 국외이전 안내서를 고지합니다.`,
    ),
    overseasRows.length === 0
      ? P('  현재 국외이전은 이루어지지 않습니다. 국외 서버를 사용할 경우 본 조를 갱신하여야 합니다.')
      : {
          kind: 'table',
          head: ['No.', '전송 국가', '수신자', '이전 항목 및 목적', '이전 방법 및 보호조치'],
          rows: overseasRows,
          widths: [5, 12, 20, 33, 30],
        },
    ...p.overseas.map(
      (t): Block => ({
        kind: 'note',
        tone: 'info',
        title: `${t.country} · ${t.entity} 이동을 위한 정보주체 확보 절차`,
        text: t.consentProcess,
      }),
    ),

    C('제4장 개인정보의 파기 및 안전성 확보'),

    H('제11조', '(개인정보의 파기 절차 및 방법)'),
    P(
      '① 회사는 처리 목적이 달성되어 더 이상 처리할 필요가 없거나 보유, 이용기간이 경과한 경우 지체 없이 해당 개인정보를 파기합니다.',
    ),
    P(p.destructionMethod),
    {
      kind: 'list',
      ordered: true,
      items: [
        '1단계. 파기 대상 확인 — 데이터베이스, 파일 서버, 로그, 백업 매체 등 모든 저장소를 대상으로 합니다.',
        '2단계. 파기 실행 — 위탁 처리의 경우에는 수탁자에 파기 지시를 내리고 파기 결과를 회신받습니다.',
        '3단계. 파기 확인 — 파기 처리 기록을 개인정보 파기 관리대장에 3년간 보관합니다.',
      ],
    },

    H('제12조', '(기술적 보호조치)'),
    secList('기술적'),

    H('제13조', '(관리적 보호조치)'),
    secList('관리적'),

    H('제14조', '(물리적 보호조치)'),
    secList('물리적'),

    C('제5장 정보주체의 권리와 의무'),

    H('제15조', '(정보주체의 권리)'),
    P(
      '정보주체는 「개인정보 보호법」 제15조 제1항 제2호부터 제4호까지의 규정에 따라 다음 각 호의 권리를 행사할 수 있습니다. 권리 행사는 아래 제20조의 연락처로 요청하며, 회사는 지체 없이 처리합니다.',
    ),
    {
      kind: 'list',
      ordered: true,
      items: [
        '개인정보의 열람 및 열람의 정지를 요구할 권리',
        '개인정보의 정정 및 삭제를 요구할 권리',
        '개인정보의 처리정지를 요구할 권리',
        '개인정보의 수집 및 이용에 대한 동의를 철회할 권리',
      ],
    },

    H('제16조', '(열람 및 열람의 정지)'),
    P(
      '① 정보주체가 자신의 개인정보에 대한 열람을 요구하는 경우, 회사는 정보주체를 확인한 후 그 요구를 받은 날부터 10일 이내에 회사가 보유하는 개인정보의 열람 절차 및 방법을 안내합니다.',
    ),
    P(
      '② 회사가 보유하는 개인정보의 열람을 요구하는 경우, 회사는 법 제18조 제4항에 따라 정보주체 본인이 확인한 경우에 한하여 제공합니다.',
    ),

    H('제17조', '(정정, 삭제 및 처리정지 요구)'),
    P(
      '① 정보주체가 정정 또는 삭제를 요구할 경우, 회사는 법 제15조 제2항과 법 제18조 제4항에 따라 처리합니다.',
    ),
    P(
      '② 정보주체가 처리정지를 요구할 경우, 회사는 처리정지 요구를 받은 날부터 10일 이내에 처리정지 절차 및 방법을 안내합니다.',
    ),
    P(
      '③ 정보주체가 동의 철회를 요구할 경우, 회사는 해당 정보주체의 동의 철회 사실과 사유를 안내합니다. 회사가 이미 개인정보를 처리한 경우에는 법 제18조 제2항에 따라 처리를 중지합니다.',
    ),
    P('④ 회사는 제1항부터 제3항까지의 요구를 받은 경우 요구 내용을 확인한 후 조치 결과를 정보주체에게 알립니다.'),

    H('제18조', '(처리정지 요구 시 거절 사유)'),
    P('① 회사는 법 제18조 제2항의 사유가 발생하는 경우 정보주체의 처리정지 요구를 거절할 수 있습니다.'),
    {
      kind: 'list',
      items: [
        '통계 또는 학술연구 등의 목적에 따른 처리로 법 제18조 제2항 각 호에 해당하는 경우',
        '공익 또는 집단의 이익을 위한 통계정보 작성 및 제공으로 법 제18조 제2항 각 호에 해당하는 경우',
        '법령에 따른 정보공개 요구로 법 제18조 제2항 각 호에 해당하는 경우',
        '정보주체의 권리행사가 다른 정보주체의 권리와 자유를 침해할 수 있는 경우',
      ],
    },

    H('제19조', '(불만 및 신고의 접수)'),
    P(
      '① 회사는 정보주체가 서비스 이용에 대하여 불만을 제기하거나 신고를 하고자 하는 경우 아래 연락처로 접수하며, 불만을 접수한 날부터 10일 이내에 조사하여 조치 결과를 통지합니다.',
    ),
    { kind: 'table', head: ['구분', '내용'], rows: officerRows(o.cpo, '보호책임자'), widths: [30, 70] },

    C('제6장 개인정보 보호책임자 및 기타 사항'),

    H('제20조', '(개인정보 보호책임자)'),
    P(
      '회사는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 정보주체의 불만 처리 및 피해 구제를 위하여 아래와 같이 개인정보 보호책임자를 지정합니다.',
    ),
    { kind: 'table', head: ['구분', '내용'], rows: officerRows(o.cpo, '보호책임자'), widths: [30, 70] },
    P(
      '② 국외이전 통지문의 작성 및 관리 등 「개인정보 보호법」 제39조에 따른 국외이전 관련 업무를 수행하기 위해 다음의 부서장을 선정업무 담당자로 지정합니다.',
    ),
    { kind: 'table', head: ['구분', '내용'], rows: officerRows(o.officer, '선정업무 담당자'), widths: [30, 70] },
    P(`③ 개인정보 보호책임자는 다음 업무를 관할합니다. ${officerText(o.cpo)}`),

    H('제21조', '(주의의무 및 책임)'),
    P(
      '① 회사의 임직원은 개인정보를 처리할 때 「개인정보 보호법」 제23조에 따라 비밀유지 의무를 다합니다. 임직원이 개인정보를 무단으로 제3자에게 제공하거나 유출하여 손해를 입히면 회사는 이에 대한 책임을 부담합니다.',
    ),
    P('② 회사는 개인정보 처리와 관련하여 정보주체에게 손해배상을 청구할 수 있습니다.'),

    H('제22조', '(개인정보 처리방침의 변경)'),
    P(
      `이 개인정보 처리방침은 ${formatKoreanDate(o.effectiveDate)}부터 적용됩니다. 처리방침을 변경하는 경우 변경된 내용을 회사의 홈페이지 공지사항에 고지하며, 변경된 처리방침은 고지 후 최소 7일이 경과한 날부터 시행합니다.`,
    ),

    {
      kind: 'appendix',
      title: '별첨 1. 개인정보 처리현황 요약',
      blocks: [
        { kind: 'heading', level: 2, text: '1. 개인정보처리시스템' },
        { kind: 'list', items: p.services },
        { kind: 'heading', level: 2, text: '2. 수집 항목' },
        { kind: 'paragraph', text: piiString(state) },
        { kind: 'heading', level: 2, text: '3. 업종 특이사항' },
        { kind: 'paragraph', text: industryNote(state) || industryLabel(state) },
        { kind: 'heading', level: 2, text: '4. 법인 기본 정보' },
        { kind: 'table', head: ['구분', '내용'], rows: orgMetaRows(state), widths: [26, 74] },
      ],
    },
    {
      kind: 'appendix',
      title: '별첨 2. 부칙',
      blocks: [
        P(
          `① 이 처리방침은 ${formatKoreanDate(o.effectiveDate)}에 ${o.approvalBody || '대표이사'} 승인을 거쳐 제정되었으며, 차기 검토일인 ${formatKoreanDate(o.nextReview)}에 개정 여부를 재검토합니다.`,
        ),
        P(
          `② ${name}은 본 처리방침을 회사 홈페이지에 공개하며, 관계 법령이 이 처리방침의 내용을 변경하는 경우에도 본 처리방침을 그에 맞게 변경합니다.`,
        ),
        P(
          '③ 본 처리방침에 규정한 수준 이상의 개인정보를 수집하거나 이용하는 경우에는 관련 법령에 따라 별도의 동의 및 안전성 확보 조치를 먼저 이행합니다.',
        ),
      ],
    },
    { kind: 'signature', roles: [`${name} 대표이사  ${o.ceo}  (인)`, `개인정보 보호책임자  ${o.cpo.name}  (인)`] },
    ...boilerplateNoteBlocks(state),
  ];
}
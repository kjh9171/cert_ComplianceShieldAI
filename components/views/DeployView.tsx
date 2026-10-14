'use client';

import { useState } from 'react';
import {
  BookOpen,
  Check,
  ClipboardCopy,
  Code2,
  Cpu,
  ExternalLink,
  KeyRound,
  Rocket,
  Server,
  Terminal,
} from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';

const STEPS = [
  {
    title: '의존성 설치 및 개발 서버 실행',
    cmd: 'npm install\nnpm run dev',
    desc: 'http://localhost:3000 에서 동작을 확인합니다.',
  },
  {
    title: 'GitHub 저장소에 반영',
    cmd: 'git add .\ngit commit -m "feat: ComplianceShield AI 초기 배포"\ngit push origin main',
    desc: 'origin 은 이 저장소를 가리키는 원격 저장소입니다.',
  },
  {
    title: 'Vercel 신규 프로젝트 생성',
    cmd: '1) vercel.com 접속 → Add New → Project\n2) 저장소 선택 → Framework: Next.js 자동 감지\n3) Deploy 클릭',
    desc: '별도 빌드 설정 없이 자동으로 배포됩니다.',
  },
];

const ENV_VARS = [
  { key: 'ANTHROPIC_API_KEY', desc: 'Claude 연동용 (선택). 입력 시 대화형 생성 품질이 향상됩니다.' },
  { key: 'OPENAI_API_KEY', desc: 'OpenAI 연동용 (선택). Anthropic 키가 없을 때 사용됩니다.' },
  { key: 'LLM_MODEL', desc: '사용할 모델명 (선택). 기본값 claude-sonnet-4-5' },
  { key: 'LLM_ENABLED', desc: 'false 로 설정하면 규칙 엔진만 사용합니다. (선택)' },
];

const ENDPOINTS = [
  { method: 'POST', path: '/api/generate', desc: 'DocState + 문서 종류를 받아 완성된 문서를 반환합니다.' },
  { method: 'POST', path: '/api/chat', desc: '자연어 요청을 문서 변경 작업(PatchOp)으로 변환합니다.' },
  { method: 'POST', path: '/api/export', desc: 'docx / pdf / md / txt / hwp 형식으로 변환합니다.' },
];

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-slate-400">
          <Terminal className="h-3 w-3" />
          {label ?? 'terminal'}
        </span>
        <button
          onClick={async () => {
            if (await copyToClipboard(code)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }
          }}
          className="inline-flex items-center gap-1 font-sans text-[10.5px] font-semibold text-slate-400 transition hover:text-white"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <ClipboardCopy className="h-3 w-3" />}
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed text-slate-200">
        {code}
      </pre>
    </div>
  );
}

export function DeployView({ origin }: { origin: string }) {
  const curlExample = `curl -X POST "${origin}/api/generate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateId": "privacy-policy",
    "state": {
      "org": {
        "name": "주식회사 에이비씨",
        "cpo": { "name": "김철수", "email": "privacy@abc.co.kr" },
        "effectiveDate": "2026-10-14"
      },
      "processing": { "industry": "ecommerce" }
    }
  }'`;

  const chatExample = `curl -X POST "${origin}/api/chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "주민등록번호 추가하고 유출방지 조치 적용해줘",
    "state": { }
  }'`;

  const exportExample = `curl -X POST "${origin}/api/export" \\
  -H "Content-Type: application/json" \\
  -d '{ "templateId": "internal-plan", "format": "docx", "state": {} }' \\
  --output 내부관리계획서.docx`;

  return (
    <div className="space-y-5">
      {/* 배포 가이드 */}
      <section className="cs-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="cs-section-title">
            <Rocket className="h-[18px] w-[18px] text-brand-600" />
            Vercel 배포 가이드
          </h2>
          <p className="mt-1 font-sans text-[12px] text-slate-500">
            별도 서버 설정 없이 이 저장소를 Vercel 에 연결하면 바로 배포됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 font-mono text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="font-sans text-[12.5px] font-bold text-slate-800">{step.title}</h3>
              </div>
              <div className="flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <pre className="overflow-x-auto p-3.5 font-mono text-[11px] leading-relaxed text-slate-200">
                  {step.cmd}
                </pre>
              </div>
              <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 환경 변수 */}
        <section className="cs-card p-5">
          <h2 className="cs-section-title">
            <KeyRound className="h-[18px] w-[18px] text-amber-600" />
            환경 변수 (선택)
          </h2>
          <p className="mt-1 font-sans text-[11.5px] leading-relaxed text-slate-500">
            <strong className="text-slate-700">API 키 없이도 100% 동작합니다.</strong> 키가 없으면 내장된
            한국어 규칙 엔진이 동일한 PatchOp 계약을 생성합니다.
          </p>

          <ul className="mt-3 space-y-2">
            {ENV_VARS.map((v) => (
              <li key={v.key} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
                <p className="font-mono text-[11.5px] font-bold text-slate-800">{v.key}</p>
                <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-slate-500">{v.desc}</p>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <CodeBlock
              label="env (Vercel → Settings → Environment Variables)"
              code={ENV_VARS.map((v) => `${v.key}=`).join('\n')}
            />
          </div>
        </section>

        {/* 엔드포인트 */}
        <section className="cs-card p-5">
          <h2 className="cs-section-title">
            <Server className="h-[18px] w-[18px] text-emerald-600" />
            REST API
          </h2>
          <p className="mt-1 font-sans text-[11.5px] leading-relaxed text-slate-500">
            외부 시스템(그룹웨어, ERP, 사내 포털)에서 직접 호출할 수 있습니다.
          </p>

          <ul className="mt-3 space-y-2">
            {ENDPOINTS.map((e) => (
              <li key={e.path} className="flex items-start gap-2.5 rounded-xl border border-slate-200 px-3.5 py-2.5">
                <span className="mt-0.5 shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                  {e.method}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[12px] font-semibold text-slate-800">{e.path}</p>
                  <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-slate-500">{e.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
            <p className="font-sans text-[11.5px] font-bold text-slate-800">응답 형식</p>
            <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-slate-500">
              {`{ blocks: Block[], plainText: string, markdown: string,\n  fileSlug: string, wordCount: number }`}
            </p>
          </div>
        </section>
      </div>

      {/* cURL 예제 */}
      <section className="cs-card p-5">
        <h2 className="cs-section-title">
          <Code2 className="h-[18px] w-[18px] text-brand-600" />
          호출 예제
        </h2>

        <div className="mt-3 space-y-4">
          <div>
            <p className="mb-1.5 font-sans text-[11.5px] font-bold text-slate-700">문서 생성</p>
            <CodeBlock code={curlExample} label="curl — POST /api/generate" />
          </div>
          <div>
            <p className="mb-1.5 font-sans text-[11.5px] font-bold text-slate-700">대화형 수정</p>
            <CodeBlock code={chatExample} label="curl — POST /api/chat" />
          </div>
          <div>
            <p className="mb-1.5 font-sans text-[11.5px] font-bold text-slate-700">파일 변환</p>
            <CodeBlock code={exportExample} label="curl — POST /api/export" />
          </div>
        </div>
      </section>

      {/* 기술 스택 */}
      <section className="cs-card p-5">
        <h2 className="cs-section-title">
          <Cpu className="h-[18px] w-[18px] text-slate-500" />
          기술 구성
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {[
            ['Next.js 15', 'App Router · Route Handlers'],
            ['React 19', '서버 · 클라이언트 컴포넌트'],
            ['TypeScript', 'strict 모드'],
            ['Tailwind CSS', '밝은 테마 디자인 시스템'],
            ['docx', '서버 사이드 DOCX 생성'],
            ['lucide-react', '아이콘'],
            ['Next.js Font', 'Noto Sans/Serif KR'],
            ['Edge Ready', 'Vercel 서버리스 최적화'],
          ].map(([name, desc]) => (
            <div key={name} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
              <p className="font-sans text-[12px] font-bold text-slate-800">{name}</p>
              <p className="mt-0.5 font-sans text-[10.5px] leading-snug text-slate-500">{desc}</p>
            </div>
          ))}
        </div>

        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="cs-btn-primary cs-btn-sm mt-4"
        >
          Vercel 대시보드 열기
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      {/* 법령 안내 */}
      <section className="cs-card border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="h-4.5 w-4.5 shrink-0 text-slate-400" />
          <div>
            <p className="font-sans text-[12.5px] font-bold text-slate-800">법적 고지</p>
            <p className="mt-1 font-sans text-[11.5px] leading-relaxed text-slate-600">
              본 서비스가 생성하는 문서는 「개인정보 보호법」 및 관계 법령의 기재 요건을 바탕으로 작성된
              초안입니다. 실제 사용 시에는 귀하의 업무 특성에 맞는 검토와 수정, 그리고 필요하다면 법무 담당자의
              검토를 거친 후 배포하시기 바랍니다. 법령이 개정되는 경우 템플릿은 버전으로 관리됩니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export { CodeBlock, cn };
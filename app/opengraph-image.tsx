import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'ComplianceShield AI — Statutory privacy compliance documents, generated in minutes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * OG 이미지.
 * Satori(동적 폰트 다운로드)가 격리된 빌드 환경에서도 동작하도록
 * 렌더링 텍스트는 ASCII 로만 구성합니다.
 */
export default async function OpenGraphImage() {
  const tag = 'Statutory Compliance Docs';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '70px 80px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef4ff 55%, #dbe6ff 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #598bff 0%, #1d2a8f 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.6 20 5.7v5.6c0 4.5-2.9 7.9-8 9.1-5.1-1.2-8-4.6-8-9.1V5.7L12 2.6Z"
                fill="#ffffff"
                fillOpacity="0.95"
              />
              <path
                d="m8.6 12 2.2 2.3 4.6-5"
                stroke="#1d2a8f"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#0f172a', letterSpacing: -1 }}>
            ComplianceShield AI
          </div>
        </div>

        {/* 헤드라인 — 두 줄을 별도 div로 분리 (Satori 규칙) */}
        <div
          style={{
            marginTop: 40,
            fontSize: 56,
            fontWeight: 800,
            color: '#1a2fe1',
            lineHeight: 1.25,
            letterSpacing: -1.5,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div>Generate your privacy</div>
          <div>compliance documents</div>
        </div>

        <div style={{ display: 'flex', marginTop: 24, fontSize: 25, color: '#475569' }}>
          {tag} in minutes — not weeks.
        </div>

        <div style={{ display: 'flex', marginTop: 8, fontSize: 19, color: '#64748b' }}>
          Built on Korea&apos;s Personal Information Protection Act
        </div>

        {/* 태그 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
          {['Privacy Policy', 'Internal Plan', 'Guidelines', 'DPA', 'Breach Manual'].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                padding: '10px 20px',
                borderRadius: 999,
                border: '1px solid #c7d7fe',
                background: '#ffffff',
                fontSize: 19,
                fontWeight: 600,
                color: '#1a2fe1',
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
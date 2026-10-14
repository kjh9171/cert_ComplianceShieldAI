import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const sansKo = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans-ko',
  display: 'swap',
});

const serifKo = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://complianceshield.ai'),
  title: {
    default: 'ComplianceShield AI · 법정 개인정보 컴플라이언스 문서 자동 생성',
    template: '%s | ComplianceShield AI',
  },
  description:
    '기업 및 기관의 개인정보 처리방침, 개인정보 보호지침, 내부관리계획서 등 필수 법정 컴플라이언스 문서를 개인정보보호법 기준으로 자동 생성하고 관리하는 B2B SaaS 플랫폼입니다.',
  keywords: [
    '개인정보 처리방침',
    '개인정보 내부관리계획서',
    '개인정보 보호지침',
    '개인정보보호법',
    '컴플라이언스',
    'ISMS-P',
    '데이터 위반 대응',
    '법정 문서 자동 생성',
  ],
  authors: [{ name: 'ComplianceShield AI' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: 'ComplianceShield AI',
    description:
      '개인정보보호법 기준 법정 컴플라이언스 문서를 자동으로 작성하고 관리하세요.',
    siteName: 'ComplianceShield AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ComplianceShield AI',
    description: '개인정보보호법 기준 법정 컴플라이언스 문서 자동 생성 플랫폼',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${sans.variable} ${sansKo.variable} ${serifKo.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50
                     focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm
                     focus:font-semibold focus:text-white"
        >
          본문으로 건너뛰기
        </a>
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from 'next';
import ComplianceApp from '@/components/ComplianceApp';

export const metadata: Metadata = {
  title: 'ComplianceShield AI · 법정 개인정보 컴플라이언스 문서 자동 생성',
  description:
    '개인정보 처리방침, 내부관리계획서, 임직원 보호지침, 처리위탁 계약서, 유출 사고 대응 매뉴얼을 개인정보보호법 기준으로 자동 생성하고 관리합니다.',
  openGraph: {
    title: 'ComplianceShield AI',
    description: '개인정보보호법 기준 법정 컴플라이언스 문서를 자동으로 작성하세요.',
    url: '/',
    siteName: 'ComplianceShield AI',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function Page() {
  return <ComplianceApp />;
}
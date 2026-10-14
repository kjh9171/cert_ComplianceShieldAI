'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { AuditView } from '@/components/views/AuditView';
import { DashboardView } from '@/components/views/DashboardView';
import { DeployView } from '@/components/views/DeployView';
import { GeneratorView } from '@/components/views/GeneratorView';
import { VaultView } from '@/components/views/VaultView';
import { Toast } from '@/components/ui/Primitives';
import { TEMPLATE_MAP } from '@/lib/catalog';
import { useComplianceStore } from '@/lib/store';
import type { UiPrefs } from '@/lib/store';
import type { TemplateId } from '@/lib/types';

type Tone = 'success' | 'error' | 'info';

export function ComplianceApp() {
  const store = useComplianceStore();
  const { state, ui, setUi } = store;
  const [toast, setToast] = useState<{ message: string; tone: Tone } | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const showToast = useCallback((message: string, tone: Tone = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast((t) => (t?.message === message ? null : t)), 3200);
  }, []);

  const selectTemplate = useCallback(
    (id: TemplateId) => {
      setUi((prev) => ({ ...prev, templateId: id, view: 'generator' }));
    },
    [setUi],
  );

  const goView = useCallback(
    (view: UiPrefs['view']) => setUi((prev) => ({ ...prev, view })),
    [setUi],
  );

  // 잠깐(하이드레이션) 동안 사라지지 않도록 앱 전체를 메모이제이션합니다.
  const body = useMemo(() => {
    switch (ui.view) {
      case 'dashboard':
        return (
          <DashboardView
            state={state}
            onSelectTemplate={selectTemplate}
            onGoAudit={() => goView('audit')}
            onGoGenerator={() => goView('generator')}
          />
        );
      case 'generator':
        return <GeneratorView store={store} onToast={showToast} />;
      case 'vault':
        return <VaultView store={store} onToast={showToast} />;
      case 'audit':
        return <AuditView store={store} onToast={showToast} />;
      case 'deploy':
        return <DeployView origin={origin || 'https://your-app.vercel.app'} />;
      default:
        return null;
    }
  }, [ui.view, state, selectTemplate, goView, origin, showToast, store]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader
        state={state}
        ui={ui}
        onViewChange={goView}
        onTemplateChange={selectTemplate}
        onNewDoc={() => {
          selectTemplate(ui.templateId);
          showToast(
            `${TEMPLATE_MAP[ui.templateId].title} 작성 화면을 열었습니다.`,
            'info',
          );
        }}
      />

      <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6">
        {body}

        <footer className="mt-10 border-t border-slate-200 pt-5">
          <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <p className="font-sans text-[11.5px] text-slate-400">
              © {new Date().getFullYear()} ComplianceShield AI · 개인정보보호법 기준 법정 문서 자동 생성
              플랫폼
            </p>
            <p className="font-sans text-[11px] text-slate-400">
              본 서비스가 생성한 문서는 참고용 초안입니다. 실제 사용 전 반드시 검토하시기 바랍니다.
            </p>
          </div>
        </footer>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}


export default ComplianceApp;
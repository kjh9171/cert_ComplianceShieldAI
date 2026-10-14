'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applyIndustryPreset, createDefaultState, uid } from './state';
import type { DocState, SavedDoc, TemplateId } from './types';

const KEY_STATE = 'csa:doc-state:v1';
const KEY_VAULT = 'csa:vault:v1';
const KEY_UI = 'csa:ui:v1';

export interface UiPrefs {
  templateId: TemplateId;
  view: 'dashboard' | 'generator' | 'vault' | 'audit' | 'deploy';
  previewMode: 'rendered' | 'text' | 'markdown';
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 용량 초과 등 무시 */
  }
}

/**
 * 문서 상태 · 보관함 · UI 설정을 localStorage에 영속화합니다.
 * (MVP 기본 저장소. 서버 저장소가 필요하면 이 훅만 교체하면 됩니다.)
 */
export function useComplianceStore() {
  const [state, setState] = useState<DocState>(() => createDefaultState());
  const [vault, setVault] = useState<SavedDoc[]>([]);
  const [ui, setUi] = useState<UiPrefs>({
    templateId: 'privacy-policy',
    view: 'dashboard',
    previewMode: 'rendered',
  });
  const [hydrated, setHydrated] = useState(false);
  const skipNextPersist = useRef(false);

  /* ── 초기 로드 ──────────────────────────────────────────── */
  useEffect(() => {
    const savedState = readJson<DocState | null>(KEY_STATE, null);
    if (savedState?.org?.name) {
      // 기본값과 병합하여 스키마 변경에 안전하게 처리
      const base = createDefaultState(savedState.org.industry ?? 'generic');
      setState({ ...base, ...savedState, org: { ...base.org, ...savedState.org } });
    }
    setVault(readJson<SavedDoc[]>(KEY_VAULT, []));
    setUi(
      readJson<UiPrefs>(KEY_UI, {
        templateId: 'privacy-policy',
        view: 'dashboard',
        previewMode: 'rendered',
      }),
    );
    setHydrated(true);
  }, []);

  /* ── 자동 저장 ─────────────────────────────────────────── */
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEY_STATE, state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEY_UI, ui);
  }, [ui, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEY_VAULT, vault);
  }, [vault, hydrated]);

  /* ── 액션 ──────────────────────────────────────────────── */
  const patchState = useCallback((updater: (prev: DocState) => DocState) => {
    setState((prev) => updater(prev));
  }, []);

  const setField = useCallback(
    <K extends keyof DocState['org']>(key: K, value: DocState['org'][K]) => {
      setState((prev) => ({ ...prev, org: { ...prev.org, [key]: value } }));
    },
    [],
  );

  const setCpo = useCallback((key: keyof DocState['org']['cpo'], value: string) => {
    setState((prev) => ({ ...prev, org: { ...prev.org, cpo: { ...prev.org.cpo, [key]: value } } }));
  }, []);

  const setOfficer = useCallback((key: keyof DocState['org']['officer'], value: string) => {
    setState((prev) => ({
      ...prev,
      org: { ...prev.org, officer: { ...prev.org.officer, [key]: value } },
    }));
  }, []);

  const setIndustry = useCallback((industry: DocState['org']['industry']) => {
    setState((prev) => applyIndustryPreset(prev, industry));
  }, []);

  const togglePii = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      processing: {
        ...prev.processing,
        piiIds: prev.processing.piiIds.includes(id)
          ? prev.processing.piiIds.filter((x) => x !== id)
          : [...prev.processing.piiIds, id],
      },
    }));
  }, []);

  const toggleSafeguard = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      processing: {
        ...prev.processing,
        safeguardIds: prev.processing.safeguardIds.includes(id)
          ? prev.processing.safeguardIds.filter((x) => x !== id)
          : [...prev.processing.safeguardIds, id],
      },
    }));
  }, []);

  const removePii = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      processing: {
        ...prev.processing,
        piiIds: prev.processing.piiIds.filter((x) => x !== id),
      },
    }));
  }, []);

  const removeSafeguard = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      processing: {
        ...prev.processing,
        safeguardIds: prev.processing.safeguardIds.filter((x) => x !== id),
      },
    }));
  }, []);

  const removeRetention = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      processing: {
        ...prev.processing,
        retentionRules: prev.processing.retentionRules.filter((r) => r.id !== id),
      },
    }));
  }, []);

  const removeEntrusted = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      processing: {
        ...prev.processing,
        entrusted: prev.processing.entrusted.filter((e) => e.id !== id),
      },
    }));
  }, []);

  const removeThirdParty = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      processing: {
        ...prev.processing,
        thirdParties: prev.processing.thirdParties.filter((t) => t.id !== id),
      },
    }));
  }, []);

  const removeOverseas = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      processing: {
        ...prev.processing,
        overseas: prev.processing.overseas.filter((o) => o.id !== id),
      },
    }));
  }, []);

  const bumpVersion = useCallback(() => {
    setState((prev) => {
      const m = /(\d+)\.(\d+)/.exec(prev.org.version);
      const major = m ? Number(m[1]) : 1;
      const minor = m ? Number(m[2]) : 0;
      return {
        ...prev,
        org: {
          ...prev.org,
          version: `v${major}.${minor + 1}`,
          lastRevised: new Date().toISOString().slice(0, 10),
        },
      };
    });
  }, []);

  const saveToVault = useCallback(
    (templateId: TemplateId, title: string, plainText: string, pinned = true) => {
      const now = Date.now();
      setVault((prev) => {
        const existing = prev.find((d) => d.templateId === templateId && d.pinned);
        const entry: SavedDoc = {
          id: existing?.id ?? uid('doc'),
          templateId,
          title,
          version: state.org.version,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          state: structuredClone(state),
          plainText,
          pinned,
          author: state.org.cpo.name,
        };
        const rest = prev.filter((d) => d.id !== entry.id);
        return [entry, ...rest].slice(0, 50);
      });
    },
    [state],
  );

  const deleteFromVault = useCallback((id: string) => {
    setVault((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const restoreFromVault = useCallback((id: string) => {
    skipNextPersist.current = true;
    setVault((prev) => {
      const found = prev.find((d) => d.id === id);
      if (found) setState(structuredClone(found.state));
      return prev;
    });
  }, []);

  const resetAll = useCallback(() => {
    skipNextPersist.current = true;
    setState(createDefaultState());
    setVault([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(KEY_STATE);
      window.localStorage.removeItem(KEY_VAULT);
    }
  }, []);

  const resetDocs = useCallback(() => {
    setVault([]);
    if (typeof window !== 'undefined') window.localStorage.removeItem(KEY_VAULT);
  }, []);

  const skipPersistOnce = skipNextPersist;

  return {
    state,
    vault,
    ui,
    hydrated,
    setState,
    patchState,
    setUi,
    setField,
    setCpo,
    setOfficer,
    setIndustry,
    togglePii,
    toggleSafeguard,
    removePii,
    removeSafeguard,
    removeRetention,
    removeEntrusted,
    removeThirdParty,
    removeOverseas,
    bumpVersion,
    saveToVault,
    deleteFromVault,
    restoreFromVault,
    resetAll,
    resetDocs,
    skipPersistOnce,
  };
}

export type ComplianceStore = ReturnType<typeof useComplianceStore>;
'use client';

import { useCallback, useEffect, useState } from 'react';
import * as q from '@/lib/queries';
import type { Topic, Lever, Meeting } from '@/lib/types';
import MatrixView from '@/components/MatrixView';
import Dashboard from '@/components/Dashboard';
import TopicPanel from '@/components/TopicPanel';
import MeetingFlow from '@/components/MeetingFlow';
import { PrepareMeetingModal } from '@/components/Modals';

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  const map = {
    idle: { label: 'Sincronizado', color: 'var(--ink-faint)', dot: '#4b5443' },
    saving: { label: 'Salvando...', color: 'var(--ink-dim)', dot: 'var(--amber)' },
    saved: { label: 'Salvo automaticamente', color: 'var(--ink-dim)', dot: 'var(--ok)' },
    error: { label: 'Falha ao salvar', color: 'var(--red)', dot: 'var(--red)' },
  } as const;
  const m = map[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: m.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block' }}></span>
      {m.label}
    </div>
  );
}

export default function HomePage() {
  const [levers, setLevers] = useState<Lever[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [lastMeeting, setLastMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<'reuniao' | 'dashboard'>('reuniao');
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [showPrepare, setShowPrepare] = useState(false);
  const [viewingMeeting, setViewingMeeting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const refresh = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const [lv, tp, am, lm] = await Promise.all([
        q.fetchLevers(),
        q.fetchTopics(),
        q.fetchActiveMeeting(),
        q.fetchLastClosedMeeting(),
      ]);
      setLevers(lv);
      setTopics(tp);
      setActiveMeeting(am);
      setLastMeeting(lm);
      setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const handleStart = async () => {
    if (!activeMeeting) {
      try {
        await q.startMeeting();
        await refresh();
      } catch (e: any) {
        console.error(e);
        alert('Não foi possível iniciar a reunião: ' + (e?.message || 'erro desconhecido'));
        return;
      }
    }
    setViewingMeeting(true);
  };

  if (loading) {
    return <div className="app"><div className="empty-state"><h3>Carregando cockpit...</h3></div></div>;
  }

  const inMeeting = !!activeMeeting && viewingMeeting;
  const openTopic = topics.find((t) => t.id === openTopicId) || null;

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div className="brand-text"><h1>Cockpit de Gestão</h1><p>Marketing & Growth</p></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SaveIndicator status={saveStatus} />
          {!inMeeting && (
            <div className="tabs">
              <button className={'tab ' + (screen === 'reuniao' ? 'active' : '')} onClick={() => setScreen('reuniao')}>Reunião</button>
              <button className={'tab ' + (screen === 'dashboard' ? 'active' : '')} onClick={() => setScreen('dashboard')}>Dashboard</button>
            </div>
          )}
        </div>
      </div>

      {inMeeting && activeMeeting ? (
        <MeetingFlow
          meeting={activeMeeting}
          topics={topics}
          levers={levers}
          onExit={() => setViewingMeeting(false)}
          onClosed={async () => { setViewingMeeting(false); await refresh(); }}
          onRefresh={refresh}
        />
      ) : screen === 'reuniao' ? (
        <MatrixView
          topics={topics}
          levers={levers}
          activeMeeting={activeMeeting}
          onOpenTopic={(t) => setOpenTopicId(t.id)}
          onPrepare={() => setShowPrepare(true)}
          onStart={handleStart}
          onRefresh={refresh}
        />
      ) : (
        <Dashboard topics={topics} levers={levers} lastMeeting={lastMeeting} onRefresh={refresh} />
      )}

      {openTopic && <TopicPanel topic={openTopic} levers={levers} onClose={() => setOpenTopicId(null)} onRefresh={refresh} />}
      {showPrepare && <PrepareMeetingModal topics={topics} onClose={() => setShowPrepare(false)} onStart={handleStart} />}
    </div>
  );
}

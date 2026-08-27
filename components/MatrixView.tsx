'use client';

import { useState } from 'react';
import type { Topic, Lever, Meeting } from '@/lib/types';
import { kpiStatus, fmtDate } from '@/lib/types';
import { initials } from '@/components/shared';
import { NewTopicModal, NewLeverInline } from '@/components/Modals';
import ConsolidatedActions from '@/components/ConsolidatedActions';

const STATUS_DOT: Record<string, string> = { ok: 'dot-ok', atencao: 'dot-warn', critico: 'dot-bad', neutro: 'dot-warn' };

export default function MatrixView({
  topics, levers, activeMeeting, onOpenTopic, onPrepare, onStart, onRefresh,
}: {
  topics: Topic[];
  levers: Lever[];
  activeMeeting: Meeting | null;
  onOpenTopic: (t: Topic) => void;
  onPrepare: () => void;
  onStart: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [showNewTopic, setShowNewTopic] = useState(false);
  const grouped = levers.map((lev) => ({ lever: lev, topics: topics.filter((t) => t.lever_id === lev.id) }));

  return (
    <div>
      {activeMeeting && (
        <div style={{ background: 'var(--green-mid)', border: '1px solid var(--lime-dim)', borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13.5 }}>Há uma reunião em andamento, iniciada em {fmtDate(activeMeeting.date)}.</span>
          <button className="btn btn-primary btn-sm" onClick={onStart}>Continuar reunião →</button>
        </div>
      )}
      <div className="hero">
        <div><h2>Reunião de Marketing</h2></div>
        <div className="hero-actions">
          <button className="btn btn-ghost" onClick={onPrepare}>Preparar reunião</button>
          <button className="btn" onClick={() => setShowNewTopic(true)}>+ Nova pauta</button>
          <button className="btn btn-primary" onClick={onStart}>{activeMeeting ? 'Continuar reunião' : 'Iniciar reunião'}</button>
        </div>
      </div>

      <div className="matrix-wrap scrollbar">
        <div className="col-label-vert lbl-alavancas">MAPA DE ALAVANCAS</div>
        <div className="col-label-vert lbl-pautas">PAUTAS</div>
        <div className="matrix-cols">
          <div className="col-head">Canais / Pauta</div>
          <div className="col-head">Estratégia</div>
          <div className="col-head">Indicadores</div>
          <div className="col-head">Participantes</div>

          {grouped.map((g) => (
            <div key={g.lever.id} style={{ display: 'contents' }}>
              {g.topics.map((t) => (
                <div className="lever-block" key={t.id}>
                  <div className="cell" onClick={() => onOpenTopic(t)}>
                    <div className="cell-title">{t.name}</div>
                  </div>
                  <div className="cell" onClick={() => onOpenTopic(t)}>
                    <div className="cell-title">{t.strategy || '—'}</div>
                  </div>
                  <div className="kpi-stack">
                    {t.kpis.length === 0 && <div className="cell empty-cell" onClick={() => onOpenTopic(t)}>Sem indicadores</div>}
                    {t.kpis.map((k) => {
                      const s = kpiStatus(k);
                      return (
                        <div className="kpi-chip" key={k.id} onClick={() => onOpenTopic(t)}>
                          <span><span className={'status-dot ' + STATUS_DOT[s]}></span>{k.name}</span>
                          <span className="muted" style={{ fontFamily: 'var(--mono)' }}>{k.current}/{k.goal}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="cell" onClick={() => onOpenTopic(t)} style={{ cursor: 'pointer' }}>
                    <div className="people-stack">
                      {t.participants.slice(0, 4).map((p) => <div className="avatar" key={p.id} title={p.name}>{initials(p.name)}</div>)}
                      {t.participants.length === 0 && <span className="empty-cell">Sem participantes</span>}
                    </div>
                  </div>
                </div>
              ))}
              {g.topics.length === 0 && <div className="muted" style={{ gridColumn: '1/-1', padding: '4px 4px 10px' }}>Nenhuma pauta nesta alavanca ainda.</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 14 }}><NewLeverInline onSaved={onRefresh} /></div>

      <ConsolidatedActions topics={topics} />

      {showNewTopic && <NewTopicModal levers={levers} onClose={() => setShowNewTopic(false)} onSaved={onRefresh} />}
    </div>
  );
}

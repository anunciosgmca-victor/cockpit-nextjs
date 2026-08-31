'use client';

import type { Topic, Lever, Meeting } from '@/lib/types';
import { kpiStatus, fmtDate, todayISO } from '@/lib/types';
import { StatusPill, trySave } from '@/components/shared';
import * as q from '@/lib/queries';

export default function Dashboard({ topics, levers, lastMeeting, onRefresh }: { topics: Topic[]; levers: Lever[]; lastMeeting: Meeting | null; onRefresh: () => Promise<void> }) {
  const allKpis = topics.flatMap((t) => t.kpis);
  const ok = allKpis.filter((k) => kpiStatus(k) === 'ok').length;
  const atencao = allKpis.filter((k) => kpiStatus(k) === 'atencao').length;
  const critico = allKpis.filter((k) => kpiStatus(k) === 'critico').length;
  const allActions = topics.flatMap((t) => t.action_items);
  const open = allActions.filter((a) => a.status !== 'Concluído');
  const overdue = open.filter((a) => a.deadline && a.deadline < todayISO());
  const pendingDefs = topics.filter((t) => t.kpis.some((k) => kpiStatus(k) !== 'ok') && !t.topic_notes[0]?.decision).length;

  const lastMeetingNotes = lastMeeting ? topics.map((t) => ({ topic: t.name, note: t.topic_notes.find((n) => n.meeting_id === lastMeeting.id) })).filter((x) => x.note) : [];
  const lastMeetingDecisions = lastMeetingNotes.filter((x) => x.note!.decision);
  const lastMeetingActions = topics.flatMap((t) => t.action_items.filter((a) => a.meeting_id === lastMeeting?.id).map((a) => ({ ...a, topic: t.name })));

  const deleteLastMeetingSummary = async () => {
    if (!lastMeeting) return;
    if (!window.confirm('Excluir o resumo desta reunião do dashboard? As definições e encaminhamentos já registrados continuam no histórico de cada pauta.')) return;
    const res = await trySave(() => q.deleteMeeting(lastMeeting.id));
    if (!res.ok) return;
    await onRefresh();
  };

  return (
    <div>
      <div className="hero"><div><h2>Dashboard Executivo</h2><p>Visão consolidada de todas as alavancas, pautas e indicadores da operação de marketing.</p></div></div>
      <div className="kpi-grid">
        <div className="stat-card"><div className="stat-num">{topics.length}</div><div className="stat-label">Pautas</div></div>
        <div className="stat-card"><div className="stat-num">{allKpis.length}</div><div className="stat-label">Indicadores</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--ok)' }}>{ok}</div><div className="stat-label">No alvo</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--amber)' }}>{atencao}</div><div className="stat-label">Em atenção</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--red)' }}>{critico}</div><div className="stat-label">Críticos</div></div>
        <div className="stat-card"><div className="stat-num">{open.length}</div><div className="stat-label">Encaminhamentos</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--red)' }}>{overdue.length}</div><div className="stat-label">Atrasados</div></div>
        <div className="stat-card"><div className="stat-num">{pendingDefs}</div><div className="stat-label">Definições pendentes</div></div>
      </div>

      {lastMeeting && (
        <div className="dash-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Resumo da última reunião · {fmtDate(lastMeeting.date)}</h3>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={deleteLastMeetingSummary}>Excluir resumo</button>
          </div>
          <div className="section-label">Definições</div>
          {lastMeetingDecisions.length === 0 && <div className="muted">Nenhuma definição registrada.</div>}
          {lastMeetingDecisions.map((d, i) => <div className="list-row" key={i}><span>{d.topic}</span><span className="muted" style={{ textAlign: 'right', maxWidth: '60%' }}>{d.note!.decision}</span></div>)}
          <div className="section-label">Encaminhamentos</div>
          {lastMeetingActions.length === 0 && <div className="muted">Nenhum encaminhamento criado.</div>}
          {lastMeetingActions.map((a) => <div className="list-row" key={a.id}><span>{a.description} <span className="muted">· {a.topic}</span></span><span>{a.responsible || '—'} · {fmtDate(a.deadline)}</span></div>)}
        </div>
      )}

      <div className="dash-section">
        <h3>Indicadores por pauta</h3>
        {topics.map((t) => (
          <div key={t.id}>
            <div className="list-row" style={{ fontWeight: 600 }}><span>{t.name}</span><span className="muted">{levers.find((l) => l.id === t.lever_id)?.name}</span></div>
            {t.kpis.map((k) => (
              <div className="list-row" key={k.id} style={{ paddingLeft: 14 }}>
                <span>{k.name}</span>
                <StatusPill status={kpiStatus(k)} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="dash-section">
        <h3>Encaminhamentos em aberto</h3>
        {open.length === 0 && <div className="muted">Nenhum encaminhamento em aberto.</div>}
        {open.map((a) => {
          const t = topics.find((t) => t.action_items.some((x) => x.id === a.id));
          const late = a.deadline && a.deadline < todayISO();
          return (
            <div className="list-row" key={a.id}>
              <span>{a.description} <span className="muted">· {t ? t.name : ''}</span></span>
              <span style={{ color: late ? 'var(--red)' : 'var(--ink-dim)' }}>{a.responsible || '—'} · {fmtDate(a.deadline)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { Topic } from '@/lib/types';
import { fmtDate, todayISO, mailtoForAction } from '@/lib/types';

export default function ConsolidatedActions({ topics }: { topics: Topic[] }) {
  const [filter, setFilter] = useState('todos');
  const allActions = topics.flatMap((t) =>
    t.topic_notes.flatMap((n) => (n.action_items || []).map((a) => ({ ...a, topic: t.name, topicId: t.id, participants: t.participants })))
  );
  const withEff = allActions.map((a) => {
    const overdue = a.deadline && a.deadline < todayISO() && a.status !== 'Concluído';
    return { ...a, effStatus: overdue ? 'Atrasado' : a.status };
  });
  const counts = {
    todos: withEff.length,
    'Não iniciado': withEff.filter((a) => a.effStatus === 'Não iniciado').length,
    'Em andamento': withEff.filter((a) => a.effStatus === 'Em andamento').length,
    'Atrasado': withEff.filter((a) => a.effStatus === 'Atrasado').length,
    'Concluído': withEff.filter((a) => a.effStatus === 'Concluído').length,
  } as Record<string, number>;
  const filtered = filter === 'todos' ? withEff : withEff.filter((a) => a.effStatus === filter);
  const sorted = [...filtered].sort((a, b) => (a.deadline || '9999-99-99').localeCompare(b.deadline || '9999-99-99'));
  const pillClass: Record<string, string> = { 'Não iniciado': 'pill-neutro', 'Em andamento': 'pill-atencao', 'Concluído': 'pill-ok', 'Atrasado': 'pill-critico' };

  return (
    <div className="dash-section" style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>Encaminhamentos consolidados</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['todos', 'Não iniciado', 'Em andamento', 'Atrasado', 'Concluído'].map((f) => (
            <button key={f} className={'tab ' + (filter === f ? 'active' : '')} style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setFilter(f)}>
              {f === 'todos' ? 'Todos' : f} <span className="muted" style={{ marginLeft: 4 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>
      {sorted.length === 0 && <div className="muted">Nenhum encaminhamento nesta categoria.</div>}
      {sorted.map((a) => {
        const person = a.participants.find((p) => p.name === a.responsible);
        return (
          <div className="list-row" key={a.id}>
            <span>{a.description} <span className="muted">· {a.topic}</span></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="muted">{a.responsible || '—'}</span>
              <span className="muted" style={{ fontFamily: 'var(--mono)' }}>{fmtDate(a.deadline)}</span>
              <span className={'status-pill ' + pillClass[a.effStatus]}>{a.effStatus}</span>
              {person?.email && <a className="link-btn" style={{ textDecoration: 'none' }} href={mailtoForAction(a, person.email, a.topic)}>✉</a>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

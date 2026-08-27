'use client';

import { useState } from 'react';
import type { Topic, Lever } from '@/lib/types';
import { kpiStatus, todayISO } from '@/lib/types';
import { StatusPill, trySave } from '@/components/shared';
import * as q from '@/lib/queries';

export function NewTopicModal({ levers, onClose, onSaved }: { levers: Lever[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [f, setF] = useState({ lever_id: levers[0]?.id || '', name: '', strategy: '', objective: '' });
  return (
    <div className="overlay center" onClick={onClose}>
      <div className="modalbox scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <div><div className="panel-eyebrow">Nova pauta</div><div className="panel-title">Cadastrar pauta</div></div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="field"><label>Alavanca</label>
          <select value={f.lever_id} onChange={(e) => setF({ ...f, lever_id: e.target.value })}>
            {levers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Nome da pauta</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex: Parcerias" /></div>
        <div className="field"><label>Estratégia</label><input value={f.strategy} onChange={(e) => setF({ ...f, strategy: e.target.value })} placeholder="Ex: Programa de afiliados" /></div>
        <div className="field"><label>Objetivo</label><textarea rows={2} value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })}></textarea></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" disabled={!f.name || !f.lever_id} onClick={async () => { const res = await trySave(() => q.addTopic(f)); if (!res.ok) return; onClose(); await onSaved(); }}>Criar pauta</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export function NewLeverInline({ onSaved }: { onSaved: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  if (!open) return <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>+ Nova alavanca</button>;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '8px 10px', color: 'var(--ink)' }} placeholder="Nome da alavanca" value={name} onChange={(e) => setName(e.target.value)} />
      <button className="btn btn-primary btn-sm" onClick={async () => { if (!name) return; const res = await trySave(() => q.addLever(name)); if (!res.ok) return; setName(''); setOpen(false); await onSaved(); }}>Salvar</button>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>✕</button>
    </div>
  );
}

export function PrepareMeetingModal({ topics, onClose, onStart }: { topics: Topic[]; onClose: () => void; onStart: () => void }) {
  const allKpis = topics.flatMap((t) => t.kpis.map((k) => ({ ...k, topic: t.name })));
  const critical = allKpis.filter((k) => kpiStatus(k) === 'critico');
  const attention = allKpis.filter((k) => kpiStatus(k) === 'atencao');
  const allActions = topics.flatMap((t) => t.topic_notes.flatMap((n) => (n.action_items || []).map((a) => ({ ...a, topic: t.name }))));
  const open = allActions.filter((a) => a.status !== 'Concluído');
  const overdue = open.filter((a) => a.deadline && a.deadline < todayISO());
  const priorityTopics = topics.filter((t) => t.kpis.some((k) => kpiStatus(k) !== 'ok')).slice(0, 5);

  return (
    <div className="overlay center" onClick={onClose}>
      <div className="modalbox scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <div><div className="panel-eyebrow">Antes de começar</div><div className="panel-title">Preparar reunião</div></div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 18 }}>
          <div className="stat-card" style={{ padding: 14 }}><div className="stat-num" style={{ fontSize: 24, color: 'var(--red)' }}>{critical.length}</div><div className="stat-label">Críticos</div></div>
          <div className="stat-card" style={{ padding: 14 }}><div className="stat-num" style={{ fontSize: 24, color: 'var(--amber)' }}>{attention.length}</div><div className="stat-label">Em atenção</div></div>
          <div className="stat-card" style={{ padding: 14 }}><div className="stat-num" style={{ fontSize: 24 }}>{open.length}</div><div className="stat-label">Pendentes</div></div>
          <div className="stat-card" style={{ padding: 14 }}><div className="stat-num" style={{ fontSize: 24, color: 'var(--red)' }}>{overdue.length}</div><div className="stat-label">Atrasados</div></div>
        </div>
        <div className="section-label">Pontos críticos</div>
        {critical.length === 0 && <div className="muted">Nenhum indicador crítico no momento.</div>}
        {critical.map((k) => <div className="list-row" key={k.id}><span>{k.name} <span className="muted">· {k.topic}</span></span><span style={{ fontFamily: 'var(--mono)' }}>{k.current}/{k.goal}</span></div>)}

        <div className="section-label">Encaminhamentos atrasados</div>
        {overdue.length === 0 && <div className="muted">Nenhum atraso.</div>}
        {overdue.map((a) => <div className="list-row" key={a.id}><span>{a.description} <span className="muted">· {a.topic}</span></span><span>{a.responsible}</span></div>)}

        <div className="section-label">Pautas prioritárias para esta reunião</div>
        {priorityTopics.length === 0 && <div className="muted">Tudo dentro da meta — pauta livre.</div>}
        {priorityTopics.map((t) => <div className="list-row" key={t.id}><span>{t.name}</span><StatusPill status="atencao" /></div>)}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn btn-primary" onClick={() => { onClose(); onStart(); }}>Iniciar reunião agora</button>
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

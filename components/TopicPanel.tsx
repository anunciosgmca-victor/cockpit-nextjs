'use client';

import { useState } from 'react';
import type { Topic, Lever } from '@/lib/types';
import { fmtDate, todayISO } from '@/lib/types';
import { KpiBar, ActionRow, initials } from '@/components/shared';
import * as q from '@/lib/queries';

export default function TopicPanel({ topic, levers, onClose, onRefresh }: { topic: Topic; levers: Lever[]; onClose: () => void; onRefresh: () => Promise<void> }) {
  const [tab, setTab] = useState<'visao' | 'indicadores' | 'encaminhamentos' | 'gestao' | 'historico'>('visao');
  const [decisionDraft, setDecisionDraft] = useState('');
  const [newAction, setNewAction] = useState({ desc: '', responsible: '', deadline: '' });
  const [showAddKpi, setShowAddKpi] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [busy, setBusy] = useState(false);
  const lever = levers.find((l) => l.id === topic.lever_id);

  const allActions = topic.topic_notes.flatMap((n) => n.action_items || []);
  const openActions = allActions.filter((a) => a.status !== 'Concluído');

  const saveDefinicao = async () => {
    if (!decisionDraft) return;
    setBusy(true);
    try {
      await q.upsertTopicNote({ topic_id: topic.id, meeting_id: null, decision: decisionDraft });
      setDecisionDraft('');
      await onRefresh();
    } finally { setBusy(false); }
  };

  const createAction = async () => {
    if (!newAction.desc) return;
    setBusy(true);
    try {
      await q.addActionItem({ topic_id: topic.id, description: newAction.desc, responsible: newAction.responsible, deadline: newAction.deadline || null });
      setNewAction({ desc: '', responsible: '', deadline: '' });
      await onRefresh();
    } finally { setBusy(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    await q.updateActionStatus(id, status);
    await onRefresh();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <div>
            <div className="badge-lever">{lever ? lever.name : '—'}</div>
            <div className="panel-title">{topic.name}</div>
            <div className="muted" style={{ marginTop: 4 }}>Estratégia: <span style={{ color: 'var(--lime)' }}>{topic.strategy}</span></div>
          </div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>

        <div className="subtabs">
          <button className={'subtab ' + (tab === 'visao' ? 'active' : '')} onClick={() => setTab('visao')}>Visão Geral</button>
          <button className={'subtab ' + (tab === 'indicadores' ? 'active' : '')} onClick={() => setTab('indicadores')}>Indicadores</button>
          <button className={'subtab ' + (tab === 'encaminhamentos' ? 'active' : '')} onClick={() => setTab('encaminhamentos')}>Encaminhamentos</button>
          <button className={'subtab ' + (tab === 'gestao' ? 'active' : '')} onClick={() => setTab('gestao')}>Definição</button>
          <button className={'subtab ' + (tab === 'historico' ? 'active' : '')} onClick={() => setTab('historico')}>Histórico</button>
        </div>

        {tab === 'visao' && (
          <div>
            <div className="section-label">Objetivo</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-dim)' }}>{topic.objective || 'Sem objetivo definido.'}</p>
            <div className="section-label">Participantes</div>
            <div className="people-stack" style={{ marginBottom: 8 }}>
              {topic.participants.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '5px 8px 5px 5px' }}>
                  <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }} title={p.email || ''}>{initials(p.name)}</div>
                  <div style={{ fontSize: 12.5 }}>{p.name} <span className="muted">· {p.role}{p.email ? ' · ' + p.email : ''}</span></div>
                  <button
                    title="Remover participante"
                    onClick={async () => { if (window.confirm('Remover ' + p.name + ' desta pauta?')) { await q.removeParticipant(p.id); await onRefresh(); } }}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 13, padding: '0 2px', lineHeight: 1, cursor: 'pointer' }}
                  >✕</button>
                </div>
              ))}
              {topic.participants.length === 0 && <span className="empty-cell">Nenhum participante ainda.</span>}
            </div>
            {!showAddPerson ? (
              <button className="link-btn" onClick={() => setShowAddPerson(true)}>+ Adicionar participante</button>
            ) : (
              <AddPersonForm
                onCancel={() => setShowAddPerson(false)}
                onSave={async (p) => { await q.addParticipant(topic.id, p); setShowAddPerson(false); await onRefresh(); }}
              />
            )}
            <div className="divider"></div>
            <div className="section-label">Pendências abertas</div>
            {openActions.length === 0 && <div className="muted">Nenhuma pendência em aberto para esta pauta.</div>}
            {openActions.map((a) => (
              <ActionRow key={a.id} a={a} participants={topic.participants} topicName={topic.name} onStatusChange={changeStatus} />
            ))}
          </div>
        )}

        {tab === 'indicadores' && (
          <div>
            {topic.kpis.map((k) => (
              <div key={k.id}>
                <KpiBar k={k} />
                <InlineKpiEdit kpi={k} onSave={async (goal, current) => {
                  const patch: any = { goal };
                  if (current !== k.current) patch.previous = k.current;
                  if (current !== k.current) patch.current = current;
                  await q.updateKpi(k.id, patch);
                  await onRefresh();
                }} />
              </div>
            ))}
            {topic.kpis.length === 0 && <div className="muted" style={{ marginBottom: 12 }}>Nenhum indicador cadastrado.</div>}
            {!showAddKpi ? (
              <button className="link-btn" onClick={() => setShowAddKpi(true)}>+ Adicionar indicador</button>
            ) : (
              <AddKpiForm onCancel={() => setShowAddKpi(false)} onSave={async (k) => { await q.addKpi(topic.id, k); setShowAddKpi(false); await onRefresh(); }} />
            )}
          </div>
        )}

        {tab === 'encaminhamentos' && (
          <div>
            <div className="section-label">Novo encaminhamento</div>
            <div className="field"><input placeholder="O que precisa ser feito?" value={newAction.desc} onChange={(e) => setNewAction({ ...newAction, desc: e.target.value })} /></div>
            <div className="row2">
              <div className="field">
                <select value={newAction.responsible} onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })}>
                  <option value="">Responsável...</option>
                  {topic.participants.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="field"><input type="date" value={newAction.deadline} onChange={(e) => setNewAction({ ...newAction, deadline: e.target.value })} /></div>
            </div>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={createAction}>+ Criar encaminhamento</button>

            <div className="divider"></div>
            <div className="section-label">Todos os encaminhamentos</div>
            {allActions.length === 0 && <div className="muted">Nenhum encaminhamento criado para esta pauta ainda.</div>}
            {allActions.map((a) => (
              <ActionRow key={a.id} a={a} participants={topic.participants} topicName={topic.name} onStatusChange={changeStatus} />
            ))}
          </div>
        )}

        {tab === 'gestao' && (
          <div>
            <div className="section-label">Definição</div>
            <div className="field"><textarea rows={3} value={decisionDraft} onChange={(e) => setDecisionDraft(e.target.value)} placeholder="Registre a definição para esta pauta..."></textarea></div>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={saveDefinicao}>Registrar nota</button>
          </div>
        )}

        {tab === 'historico' && (
          <div>
            {topic.topic_notes.length === 0 && (
              <div className="empty-state"><h3>Sem histórico ainda</h3><p>As reuniões futuras vão alimentar esta linha do tempo automaticamente.</p></div>
            )}
            {topic.topic_notes.map((h) => (
              <div className="history-entry" key={h.id}>
                <div className="history-date">{fmtDate(h.date)}</div>
                {h.decision && <p style={{ margin: '0 0 6px', fontSize: 13 }}><strong>Definição:</strong> {h.decision}</p>}
                {(h.action_items || []).map((a) => (
                  <ActionRow key={a.id} a={a} participants={topic.participants} topicName={topic.name} onStatusChange={changeStatus} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineKpiEdit({ kpi, onSave }: { kpi: any; onSave: (goal: number, current: number) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(kpi.current);
  const [goalVal, setGoalVal] = useState(kpi.goal);
  if (!open) {
    return (
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <button className="link-btn" onClick={() => { setVal(kpi.current); setGoalVal(kpi.goal); setOpen(true); }}>Atualizar valor atual</button>
        <button className="link-btn" onClick={() => { setVal(kpi.current); setGoalVal(kpi.goal); setOpen(true); }}>Editar meta</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <label style={{ fontSize: 11, color: 'var(--ink-dim)' }}>Atual</label>
        <input type="number" style={{ width: 100, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '8px 10px', color: 'var(--ink)' }} value={val} onChange={(e) => setVal(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <label style={{ fontSize: 11, color: 'var(--ink-dim)' }}>Meta</label>
        <input type="number" style={{ width: 100, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '8px 10px', color: 'var(--ink)' }} value={goalVal} onChange={(e) => setGoalVal(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-sm" onClick={async () => { await onSave(Number(goalVal), Number(val)); setOpen(false); }}>Salvar</button>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancelar</button>
    </div>
  );
}

function AddKpiForm({ onCancel, onSave }: { onCancel: () => void; onSave: (k: { name: string; unit: string; goal: number; current: number; source: string }) => Promise<void> }) {
  const [f, setF] = useState({ name: '', unit: '', goal: '', current: '', source: '' });
  return (
    <div className="kpi-row">
      <div className="field"><input placeholder="Nome do indicador" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="row3">
        <div className="field"><input placeholder="Meta" type="number" value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} /></div>
        <div className="field"><input placeholder="Atual" type="number" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></div>
        <div className="field"><input placeholder="Unidade" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></div>
      </div>
      <div className="field"><input placeholder="Fonte (opcional)" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { if (!f.name) return; onSave({ name: f.name, unit: f.unit, goal: Number(f.goal) || 0, current: Number(f.current) || 0, source: f.source }); }}>Salvar indicador</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function AddPersonForm({ onCancel, onSave }: { onCancel: () => void; onSave: (p: { name: string; role: string; email: string }) => Promise<void> }) {
  const [f, setF] = useState({ name: '', role: '', email: '' });
  return (
    <div className="kpi-row">
      <div className="row2">
        <div className="field"><input placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><input placeholder="Função" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></div>
      </div>
      <div className="field"><input type="email" placeholder="E-mail" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { if (!f.name) return; onSave(f); }}>Adicionar</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

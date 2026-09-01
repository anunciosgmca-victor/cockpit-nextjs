'use client';

import { useState } from 'react';
import { kpiStatus, fmtDate, mailtoForAction, type Kpi, type ActionItem, type Participant, type KpiStatus } from '@/lib/types';

const STATUS_LABEL: Record<KpiStatus, string> = { ok: 'Dentro da meta', atencao: 'Atenção', critico: 'Fora da meta', neutro: 'Sem meta' };
const STATUS_DOT: Record<KpiStatus, string> = { ok: 'dot-ok', atencao: 'dot-warn', critico: 'dot-bad', neutro: 'dot-warn' };
const STATUS_PILL: Record<KpiStatus, string> = { ok: 'pill-ok', atencao: 'pill-atencao', critico: 'pill-critico', neutro: 'pill-neutro' };

export function StatusPill({ status }: { status: KpiStatus }) {
  return (
    <span className={'status-pill ' + STATUS_PILL[status]}>
      <span className={'status-dot ' + STATUS_DOT[status]}></span>
      {STATUS_LABEL[status]}
    </span>
  );
}

function variance(k: Kpi) {
  if (k.previous === null || k.previous === undefined) return null;
  return ((k.current - k.previous) / k.previous) * 100;
}

export function KpiBar({ k }: { k: Kpi }) {
  const status = kpiStatus(k);
  const pct = k.goal ? Math.min(100, Math.round((k.current / k.goal) * 100)) : 0;
  const color = status === 'ok' ? 'var(--ok)' : status === 'atencao' ? 'var(--amber)' : 'var(--red)';
  const v = variance(k);
  return (
    <div className="kpi-row">
      <div className="kpi-row-top">
        <span className="kpi-name">{k.name}</span>
        <StatusPill status={status} />
      </div>
      <div className="kpi-bar-track"><div className="kpi-bar-fill" style={{ width: pct + '%', background: color }}></div></div>
      <div className="kpi-nums">
        <span>{k.current}{k.unit ? ' ' + k.unit : ''} / meta {k.goal}{k.unit ? ' ' + k.unit : ''}</span>
        <span>{v !== null ? (v >= 0 ? '+' : '') + v.toFixed(0) + '%' : '—'}{k.previous !== null && k.previous !== undefined ? '  (ant. ' + k.previous + ')' : ''}</span>
      </div>
    </div>
  );
}

export function ActionRow({ a, participants, topicName, onStatusChange, onDelete, onEdit }: {
  a: ActionItem;
  participants: Participant[];
  topicName: string;
  onStatusChange: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, patch: { description: string; responsible: string; deadline: string | null }) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(a.description);
  const [responsible, setResponsible] = useState(a.responsible || '');
  const [deadline, setDeadline] = useState(a.deadline || '');
  const colors: Record<string, string> = { 'Não iniciado': 'pill-neutro', 'Em andamento': 'pill-atencao', 'Concluído': 'pill-ok', 'Atrasado': 'pill-critico' };
  const overdue = a.deadline && a.deadline < new Date().toISOString().slice(0, 10) && a.status !== 'Concluído';
  const effStatus = overdue ? 'Atrasado' : a.status;
  const person = participants.find((p) => p.name === a.responsible);
  const email = person?.email;

  if (editing) {
    return (
      <div className="action-item">
        <div className="field"><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="O que precisa ser feito?" /></div>
        <div className="row3" style={{ marginTop: 6 }}>
          <div className="field">
            <select value={responsible} onChange={(e) => setResponsible(e.target.value)}>
              <option value="">Responsável...</option>
              {participants.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="field"><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              if (!desc) return;
              const ok = await onEdit!(a.id, { description: desc, responsible, deadline: deadline || null });
              if (ok) setEditing(false);
            }}>Salvar</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDesc(a.description); setResponsible(a.responsible || ''); setDeadline(a.deadline || ''); setEditing(false); }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="action-item">
      <div className="action-top">
        <span className="action-desc">{a.description}</span>
        <select
          className={'status-pill ' + colors[effStatus]}
          style={{ border: 'none', background: 'transparent', fontFamily: 'inherit' }}
          value={a.status}
          onChange={(e) => onStatusChange(a.id, e.target.value)}
        >
          <option>Não iniciado</option>
          <option>Em andamento</option>
          <option>Concluído</option>
          <option>Atrasado</option>
        </select>
        {onEdit && (
          <button
            title="Editar encaminhamento"
            onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 13, padding: '0 2px', lineHeight: 1, cursor: 'pointer' }}
          >✎</button>
        )}
        {onDelete && (
          <button
            title="Excluir encaminhamento"
            onClick={() => { if (window.confirm('Excluir este encaminhamento?')) onDelete(a.id); }}
            style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 13, padding: '0 2px', lineHeight: 1, cursor: 'pointer' }}
          >✕</button>
        )}
      </div>
      <div className="action-meta">
        <span>Responsável: {a.responsible || '—'}</span>
        <span>Prazo: {fmtDate(a.deadline)}</span>
        {email ? (
          <a className="link-btn" style={{ textDecoration: 'none' }} href={mailtoForAction(a, email, topicName)}>✉ Enviar e-mail</a>
        ) : a.responsible ? (
          <span className="muted">Sem e-mail cadastrado</span>
        ) : null}
      </div>
    </div>
  );
}

export function initials(name: string) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export async function trySave<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    return { ok: true, data: await fn() };
  } catch (e: any) {
    console.error(e);
    alert('Não foi possível salvar: ' + (e?.message || 'erro desconhecido') + '\n\nVerifique sua conexão e tente novamente.');
    return { ok: false };
  }
}

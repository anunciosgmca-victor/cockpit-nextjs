'use client';

import { useEffect, useState } from 'react';
import type { Topic, Lever, Meeting } from '@/lib/types';
import { KpiBar, ActionRow } from '@/components/shared';
import * as q from '@/lib/queries';

export default function MeetingFlow({ meeting, topics, levers, onExit, onClosed, onRefresh }: {
  meeting: Meeting;
  topics: Topic[];
  levers: Lever[];
  onExit: () => void;
  onClosed: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [idx, setIdx] = useState(0);
  const topic = topics[idx];
  const lever = levers.find((l) => l.id === topic.lever_id);

  // find (or none yet) note for this topic within this meeting
  const noteForMeeting = topic.topic_notes.find((n) => n.meeting_id === meeting.id);
  const [decision, setDecision] = useState(noteForMeeting?.decision || '');
  const [noteId, setNoteId] = useState<string | undefined>(noteForMeeting?.id);
  const [newAction, setNewAction] = useState({ desc: '', responsible: '', deadline: '' });
  const [showClose, setShowClose] = useState(false);
  const saveTimer = { current: null as any };

  useEffect(() => {
    const n = topic.topic_notes.find((n) => n.meeting_id === meeting.id);
    setDecision(n?.decision || '');
    setNoteId(n?.id);
  }, [idx]);

  const commitDecision = async (val: string) => {
    setDecision(val);
    const id = await q.upsertTopicNote({ id: noteId, topic_id: topic.id, meeting_id: meeting.id, decision: val });
    if (!noteId) setNoteId(id);
  };

  const addAction = async () => {
    if (!newAction.desc) return;
    await q.addActionItem({ topic_id: topic.id, note_id: noteId, meeting_id: meeting.id, description: newAction.desc, responsible: newAction.responsible, deadline: newAction.deadline || null });
    setNewAction({ desc: '', responsible: '', deadline: '' });
    await onRefresh();
  };

  const actionsForThisMeetingNote = (topic.topic_notes.find((n) => n.id === noteId)?.action_items) || [];

  return (
    <div className="meeting-shell">
      <div className="meeting-nav">
        <button className="btn btn-ghost btn-sm" onClick={onExit}>← Sair sem fechar</button>
        <span className="step-count">{idx + 1} de {topics.length}</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowClose(true)}>Fechar reunião</button>
      </div>
      <div className="progress-track">
        {topics.map((t, i) => (
          <div key={t.id} className={'progress-seg ' + (i < idx ? 'done' : i === idx ? 'current' : '')}></div>
        ))}
      </div>

      <div className="badge-lever">{lever ? lever.name : ''}</div>
      <h2 className="meeting-topic-title">{topic.name}</h2>
      <div className="meeting-topic-strategy">Estratégia: {topic.strategy}</div>

      <div className="section-label">Indicadores</div>
      {topic.kpis.map((k) => <KpiBar key={k.id} k={k} />)}
      {topic.kpis.length === 0 && <div className="muted" style={{ marginBottom: 12 }}>Sem indicadores cadastrados para esta pauta.</div>}

      <div className="divider"></div>

      <div className="section-label">Definição</div>
      <div className="field"><textarea rows={3} value={decision} onChange={(e) => commitDecision(e.target.value)} placeholder="Registre a definição para esta pauta..."></textarea></div>

      <div className="section-label">Encaminhamentos desta pauta</div>
      {actionsForThisMeetingNote.map((a) => (
        <ActionRow key={a.id} a={a} participants={topic.participants} topicName={topic.name} onStatusChange={async (id, status) => { await q.updateActionStatus(id, status); await onRefresh(); }} />
      ))}
      <div className="row3" style={{ marginTop: 6 }}>
        <div className="field"><input placeholder="Nova ação" value={newAction.desc} onChange={(e) => setNewAction({ ...newAction, desc: e.target.value })} /></div>
        <div className="field">
          <select value={newAction.responsible} onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })}>
            <option value="">Responsável...</option>
            {topic.participants.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div className="field"><input type="date" value={newAction.deadline} onChange={(e) => setNewAction({ ...newAction, deadline: e.target.value })} /></div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={addAction}>+ Criar encaminhamento</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
        <button className="btn btn-ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Pauta anterior</button>
        {idx < topics.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setIdx(idx + 1)}>Próxima pauta →</button>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowClose(true)}>Concluir e fechar reunião</button>
        )}
      </div>

      {showClose && (
        <CloseMeetingModal
          meeting={meeting}
          topics={topics}
          onClose={() => setShowClose(false)}
          onClosed={async () => { await q.closeMeeting(meeting.id); setShowClose(false); onClosed(); }}
        />
      )}
    </div>
  );
}

function CloseMeetingModal({ meeting, topics, onClose, onClosed }: { meeting: Meeting; topics: Topic[]; onClose: () => void; onClosed: () => void }) {
  const notesThisMeeting = topics.map((t) => t.topic_notes.find((n) => n.meeting_id === meeting.id)).filter(Boolean) as any[];
  const withDecision = notesThisMeeting.filter((n) => n.decision);
  const actionsThisMeeting = topics.flatMap((t) => t.topic_notes.filter((n) => n.meeting_id === meeting.id).flatMap((n) => n.action_items || []));
  const actionsNoResp = actionsThisMeeting.filter((a) => !a.responsible);
  const actionsNoDeadline = actionsThisMeeting.filter((a) => !a.deadline);

  const checks = [
    { label: 'Todas as pautas foram analisadas', ok: notesThisMeeting.length === topics.length, detail: `${notesThisMeeting.length}/${topics.length}` },
    { label: 'Existem definições registradas', ok: withDecision.length > 0, detail: `${withDecision.length} definição(ões)` },
    { label: 'Encaminhamentos com responsável definido', ok: actionsNoResp.length === 0, detail: actionsNoResp.length ? `${actionsNoResp.length} sem responsável` : 'ok' },
    { label: 'Encaminhamentos com prazo definido', ok: actionsNoDeadline.length === 0, detail: actionsNoDeadline.length ? `${actionsNoDeadline.length} sem prazo` : 'ok' },
  ];
  const allOk = checks.every((c) => c.ok);

  return (
    <div className="overlay center" onClick={onClose}>
      <div className="modalbox scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <div><div className="panel-eyebrow">Checklist final</div><div className="panel-title">Fechar reunião</div></div>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        {checks.map((c, i) => (
          <div className="checklist-item" key={i}>
            <div className={'check-icon ' + (c.ok ? 'check-yes' : 'check-no')}>{c.ok ? '✓' : '!'}</div>
            <span style={{ flex: 1 }}>{c.label}</span>
            <span className="muted">{c.detail}</span>
          </div>
        ))}
        {!allOk && <p className="muted" style={{ marginTop: 10 }}>Você pode fechar mesmo com pendências — elas aparecerão automaticamente na preparação da próxima reunião.</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn btn-primary" onClick={onClosed}>Fechar reunião e gerar resumo</button>
          <button className="btn btn-ghost" onClick={onClose}>Voltar</button>
        </div>
      </div>
    </div>
  );
}

export type Lever = { id: string; name: string };

export type Kpi = {
  id: string;
  topic_id: string;
  name: string;
  unit: string | null;
  goal: number;
  current: number;
  previous: number | null;
  source: string | null;
};

export type Participant = {
  id: string;
  topic_id: string;
  name: string;
  role: string | null;
  email: string | null;
};

export type ActionItem = {
  id: string;
  topic_id: string;
  note_id: string | null;
  meeting_id: string | null;
  description: string;
  responsible: string | null;
  deadline: string | null;
  status: 'Não iniciado' | 'Em andamento' | 'Concluído' | 'Atrasado';
  created_at: string;
};

export type TopicNote = {
  id: string;
  topic_id: string;
  meeting_id: string | null;
  date: string;
  decision: string;
  action_items?: ActionItem[];
};

export type Topic = {
  id: string;
  lever_id: string;
  name: string;
  strategy: string;
  objective: string;
  kpis: Kpi[];
  participants: Participant[];
  topic_notes: TopicNote[];
};

export type Meeting = {
  id: string;
  date: string;
  status: 'aberta' | 'fechada';
  closed_at: string | null;
};

export type KpiStatus = 'ok' | 'atencao' | 'critico' | 'neutro';

export function kpiStatus(k: { goal: number; current: number }): KpiStatus {
  if (!k.goal) return 'neutro';
  const ratio = k.current / k.goal;
  if (ratio >= 0.95) return 'ok';
  if (ratio >= 0.75) return 'atencao';
  return 'critico';
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function mailtoForAction(a: { description: string; responsible: string | null; deadline: string | null; status: string }, email: string, topicName: string) {
  const subject = encodeURIComponent('Novo encaminhamento: ' + a.description);
  const body = encodeURIComponent(
    `Olá ${a.responsible || ''},\n\nVocê tem um encaminhamento na pauta "${topicName}":\n\n${a.description}\n\nPrazo: ${fmtDate(a.deadline)}\nStatus: ${a.status}\n`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

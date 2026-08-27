import { createClient } from '@/lib/supabase/client';
import type { Lever, Topic, Meeting } from '@/lib/types';

const supabase = createClient();

// ---------- fetch ----------
export async function fetchLevers(): Promise<Lever[]> {
  const { data, error } = await supabase.from('levers').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function fetchTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select(`
      *,
      kpis(*),
      participants(*),
      topic_notes(*),
      action_items(*)
    `)
    .order('created_at');
  if (error) throw error;
  return (data || []).map((t: any) => ({
    ...t,
    topic_notes: (t.topic_notes || []).sort((a: any, b: any) => (a.date < b.date ? 1 : -1)),
    action_items: t.action_items || [],
  })) as Topic[];
}

export async function fetchActiveMeeting(): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('status', 'aberta')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchLastClosedMeeting(): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('status', 'fechada')
    .order('closed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- levers ----------
export async function addLever(name: string) {
  const { error } = await supabase.from('levers').insert({ name });
  if (error) throw error;
}

// ---------- topics ----------
export async function addTopic(input: { lever_id: string; name: string; strategy: string; objective: string }) {
  const { error } = await supabase.from('topics').insert(input);
  if (error) throw error;
}

export async function updateTopic(id: string, patch: Partial<{ name: string; strategy: string; objective: string }>) {
  const { error } = await supabase.from('topics').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteTopic(id: string) {
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
}

// ---------- kpis ----------
export async function addKpi(topic_id: string, input: { name: string; unit: string; goal: number; current: number; source: string }) {
  const { error } = await supabase.from('kpis').insert({ topic_id, ...input });
  if (error) throw error;
}

export async function updateKpi(id: string, patch: Partial<{ goal: number; current: number; previous: number | null }>) {
  const { error } = await supabase.from('kpis').update(patch).eq('id', id);
  if (error) throw error;
}

// ---------- participants ----------
export async function addParticipant(topic_id: string, input: { name: string; role: string; email: string }) {
  const { error } = await supabase.from('participants').insert({ topic_id, ...input });
  if (error) throw error;
}

export async function removeParticipant(id: string) {
  const { error } = await supabase.from('participants').delete().eq('id', id);
  if (error) throw error;
}

// ---------- meetings ----------
export async function startMeeting(): Promise<string> {
  const { data, error } = await supabase.from('meetings').insert({}).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function closeMeeting(id: string) {
  const { error } = await supabase.from('meetings').update({ status: 'fechada', closed_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// ---------- topic notes (Definição) ----------
export async function upsertTopicNote(input: { id?: string; topic_id: string; meeting_id: string | null; decision: string }) {
  if (input.id) {
    const { error } = await supabase.from('topic_notes').update({ decision: input.decision }).eq('id', input.id);
    if (error) throw error;
    return input.id;
  }
  const { data, error } = await supabase
    .from('topic_notes')
    .insert({ topic_id: input.topic_id, meeting_id: input.meeting_id, decision: input.decision })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

// ---------- action items (Encaminhamentos) ----------
export async function addActionItem(input: { topic_id: string; note_id?: string | null; meeting_id?: string | null; description: string; responsible: string; deadline: string | null }) {
  const { error } = await supabase.from('action_items').insert({
    topic_id: input.topic_id,
    note_id: input.note_id ?? null,
    meeting_id: input.meeting_id ?? null,
    description: input.description,
    responsible: input.responsible,
    deadline: input.deadline || null,
  });
  if (error) throw error;
}

export async function updateActionStatus(id: string, status: string) {
  const { error } = await supabase.from('action_items').update({ status }).eq('id', id);
  if (error) throw error;
}

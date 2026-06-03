import { createClient } from '@supabase/supabase-js'

// Reemplaza estos valores con los tuyos de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── API helpers ──────────────────────────────────────────────────────────────

export async function saveSubmission(prediction) {
  const { error } = await supabase
    .from('predictions')
    .upsert({ name: prediction.name, data: prediction }, { onConflict: 'name' })
  if (error) throw error
}

export async function saveDraft(name, draft) {
  const { error } = await supabase
    .from('drafts')
    .upsert({ name, data: draft }, { onConflict: 'name' })
  if (error) throw error
}

export async function loadDraft(name) {
  const { data } = await supabase.from('drafts').select('data').eq('name', name).single()
  return data?.data || null
}

export async function loadAllPredictions() {
  const { data, error } = await supabase.from('predictions').select('name, data')
  if (error) return []
  return data.map(r => r.data)
}

export async function loadOfficial() {
  const { data } = await supabase.from('official').select('data').eq('id', 1).single()
  return data?.data || null
}

export async function saveOfficial(results) {
  const { error } = await supabase
    .from('official')
    .upsert({ id: 1, data: results }, { onConflict: 'id' })
  if (error) throw error
}

export async function togglePaid(name, paid) {
  const { error } = await supabase
    .from('predictions')
    .update({ paid })
    .eq('name', name)
  if (error) throw error
}

export async function subscribeToRanking(callback) {
  return supabase
    .channel('ranking')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'official' }, callback)
    .subscribe()
}

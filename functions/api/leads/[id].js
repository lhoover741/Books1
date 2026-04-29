
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }); }
async function body(request){ try { return await request.json(); } catch { return {}; } }
export async function onRequestGet({ env, params }) {
  if (!env.LEADS_DB) return json({ ok:false, error:'Missing LEADS_DB binding.' }, 500);
  const lead = await env.LEADS_DB.prepare('SELECT * FROM leads WHERE id = ?').bind(params.id).first();
  const notes = await env.LEADS_DB.prepare('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC').bind(params.id).all();
  return json({ ok:true, lead, notes: notes.results || [] });
}
export async function onRequestPatch({ request, env, params }) {
  if (!env.LEADS_DB) return json({ ok:false, error:'Missing LEADS_DB binding.' }, 500);
  const data = await body(request);
  const status = data.status || 'New';
  await env.LEADS_DB.prepare('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?').bind(status, new Date().toISOString(), params.id).run();
  return json({ ok:true });
}

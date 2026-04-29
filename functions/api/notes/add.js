
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }); }
export async function onRequestPost({ request, env }) {
  if (!env.LEADS_DB) return json({ ok:false, error:'Missing LEADS_DB binding.' }, 500);
  const data = await request.json();
  if (!data.lead_id || !data.note) return json({ ok:false, error:'lead_id and note are required.' }, 400);
  await env.LEADS_DB.prepare('INSERT INTO lead_notes (lead_id, note, created_at) VALUES (?, ?, ?)').bind(data.lead_id, data.note, new Date().toISOString()).run();
  return json({ ok:true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

export async function onRequestPost({ request, env }) {
  if (!env.LEADS_DB) return json({ ok: false, error: 'Missing LEADS_DB binding.' }, 500);

  let data = {};
  try { data = await request.json(); } catch (_) {}

  const leadId = Number(data.lead_id);
  const note = String(data.note || '').trim();

  if (!leadId || !note) return json({ ok: false, error: 'Lead ID and note are required.' }, 400);

  await env.LEADS_DB.prepare('INSERT INTO lead_notes (lead_id, note, created_at) VALUES (?, ?, ?)')
    .bind(leadId, note, new Date().toISOString())
    .run();

  return json({ ok: true });
}

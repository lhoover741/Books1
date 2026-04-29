
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }); }
export async function onRequestGet({ env }) {
  if (!env.LEADS_DB) return json({ ok:false, error:'Missing LEADS_DB binding. Create D1 database and bind it in Cloudflare Pages.' }, 500);
  const rows = await env.LEADS_DB.prepare('SELECT * FROM leads ORDER BY submitted_at DESC LIMIT 200').all();
  return json({ ok:true, leads: rows.results || [] });
}

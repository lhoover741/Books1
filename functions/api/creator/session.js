function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

function decodeToken(token = '') {
  try {
    const raw = atob(token);
    const parts = raw.split(':');
    return { email: parts[0] || '', id: Number(parts[1]), issuedAt: Number(parts[2]) };
  } catch (_) {
    return null;
  }
}

function expired(issuedAt) {
  if (!issuedAt) return true;
  return Date.now() - issuedAt > 24 * 60 * 60 * 1000;
}

export async function onRequestPost({ request, env }) {
  const db = env.LEADS_DB || env.DB;
  if (!db) return json({ ok:false, error:'Missing database binding.' }, 500);

  const data = await body(request);
  const email = String(data.email || '').trim().toLowerCase();
  const token = String(data.token || '').trim();
  const leadId = Number(data.lead_id);

  if (!email || !token || !leadId) return json({ ok:false, error:'Missing session data.' }, 401);

  const decoded = decodeToken(token);
  if (!decoded || decoded.email !== email || decoded.id !== leadId) {
    return json({ ok:false, error:'Invalid session.' }, 401);
  }

  if (expired(decoded.issuedAt)) {
    return json({ ok:false, error:'Session expired.' }, 401);
  }

  const creator = await db.prepare(
    'SELECT id, name, email, status, form_type FROM leads WHERE id = ? AND lower(email) = ? AND form_type = ? LIMIT 1'
  ).bind(leadId, email, 'creator_application').first();

  if (!creator) return json({ ok:false, error:'Creator not found.' }, 404);
  if (creator.status !== 'Approved') return json({ ok:false, error:'Creator not approved.' }, 403);

  return json({ ok:true, creator });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

function makeToken(email, id) {
  return btoa(`${email}:${id}:${Date.now()}`);
}

export async function onRequestPost({ request, env }) {
  const db = env.LEADS_DB || env.DB;
  if (!db) return json({ ok:false, error:'Missing database binding.' }, 500);

  const data = await body(request);
  const email = String(data.email || '').trim().toLowerCase();
  const code = String(data.code || '').trim();
  const expectedCode = String(env.CREATOR_ACCESS_CODE || '').trim();

  if (!email || !code) return json({ ok:false, error:'Email and access code are required.' }, 400);
  if (!expectedCode) return json({ ok:false, error:'Creator access code is not configured.' }, 500);
  if (code !== expectedCode) return json({ ok:false, error:'Invalid access code.' }, 401);

  const creator = await db.prepare(
    'SELECT * FROM leads WHERE lower(email) = ? AND form_type = ? ORDER BY id DESC LIMIT 1'
  ).bind(email, 'creator_application').first();

  if (!creator) return json({ ok:false, error:'Creator application not found.' }, 404);
  if (creator.status !== 'Approved') return json({ ok:false, error:'Creator account is not approved yet.' }, 403);

  return json({
    ok:true,
    token: makeToken(email, creator.id),
    lead_id: creator.id,
    name: creator.name || '',
    email: creator.email || email
  });
}

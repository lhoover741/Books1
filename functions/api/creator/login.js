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

function parseCodeFromNote(note = '') {
  const match = String(note).match(/Login code generated:\s*(\d{6})/i);
  return match ? match[1] : '';
}

function isExpired(createdAt) {
  const created = new Date(createdAt).getTime();
  if (!created) return true;
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return Date.now() - created > twentyFourHours;
}

export async function onRequestPost({ request, env }) {
  const db = env.LEADS_DB || env.DB;
  if (!db) return json({ ok:false, error:'Missing database binding.' }, 500);

  const data = await body(request);
  const email = String(data.email || '').trim().toLowerCase();
  const code = String(data.code || '').trim();

  if (!email || !code) return json({ ok:false, error:'Email and access code are required.' }, 400);

  const creator = await db.prepare(
    'SELECT * FROM leads WHERE lower(email) = ? AND form_type = ? ORDER BY id DESC LIMIT 1'
  ).bind(email, 'creator_application').first();

  if (!creator) return json({ ok:false, error:'Creator application not found.' }, 404);
  if (creator.status !== 'Approved') return json({ ok:false, error:'Creator account is not approved yet.' }, 403);

  const notes = await db.prepare(
    'SELECT note, created_at FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC'
  ).bind(creator.id).all();

  const codeNote = (notes.results || []).find(n => String(n.note || '').includes('Login code generated'));
  if (!codeNote) return json({ ok:false, error:'No access code found. Request a new code.' }, 403);

  if (isExpired(codeNote.created_at)) {
    return json({ ok:false, error:'Access code expired. Request a new code.' }, 403);
  }

  const storedCode = parseCodeFromNote(codeNote.note);
  if (!storedCode || code !== storedCode) return json({ ok:false, error:'Invalid access code.' }, 401);

  return json({
    ok:true,
    token: makeToken(email, creator.id),
    lead_id: creator.id,
    name: creator.name || '',
    email: creator.email || email
  });
}

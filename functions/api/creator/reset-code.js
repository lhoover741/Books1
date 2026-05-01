function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

function generateCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

async function resend(env, payload) {
  if (!env.RESEND_API_KEY || !env.LEAD_FROM_EMAIL) return { skipped:true };
  const res = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ Authorization:`Bearer ${env.RESEND_API_KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ from: env.LEAD_FROM_EMAIL, ...payload })
  });
  return { ok: res.ok };
}

export async function onRequestPost({ request, env }) {
  const db = env.LEADS_DB || env.DB;
  if (!db) return json({ ok:false, error:'Missing DB' }, 500);

  const data = await body(request);
  const email = String(data.email || '').trim().toLowerCase();

  if (!email) return json({ ok:false, error:'Email required' }, 400);

  const creator = await db.prepare(
    'SELECT * FROM leads WHERE lower(email) = ? AND form_type = ? ORDER BY id DESC LIMIT 1'
  ).bind(email, 'creator_application').first();

  if (!creator || creator.status !== 'Approved') {
    return json({ ok:false, error:'Not approved' }, 403);
  }

  const code = generateCode();

  await db.prepare('INSERT INTO lead_notes (lead_id, note, created_at) VALUES (?, ?, ?)')
    .bind(creator.id, `Login code generated: ${code}`, new Date().toISOString())
    .run();

  await resend(env, {
    to: creator.email,
    subject: 'Your New Creator Access Code',
    html: `<h1>New Code</h1><p>Your new code:</p><p style="font-size:28px;font-weight:bold;">${code}</p>`
  });

  return json({ ok:true });
}

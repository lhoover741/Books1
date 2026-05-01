function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }); }
async function body(request){ try { return await request.json(); } catch { return {}; } }

async function resend(env, payload) {
  if (!env.RESEND_API_KEY || !env.LEAD_FROM_EMAIL) return { skipped:true };
  const res = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ Authorization:`Bearer ${env.RESEND_API_KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ from: env.LEAD_FROM_EMAIL, ...payload })
  });
  return { ok: res.ok, status: res.status };
}

function generateSixDigitCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

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
  const now = new Date().toISOString();

  const lead = await env.LEADS_DB.prepare('SELECT * FROM leads WHERE id = ?').bind(params.id).first();

  await env.LEADS_DB.prepare('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, now, params.id).run();

  // Only trigger approval emails when a pending creator is approved for the first time.
  if (lead && lead.form_type === 'creator_application' && status === 'Approved' && lead.status !== 'Approved') {
    const code = generateSixDigitCode();

    await resend(env, {
      to: lead.email,
      subject: 'You’ve been approved - Books and Brews Creator Network',
      html: `<h1>You're Approved</h1><p>Hi ${lead.name || ''},</p><p>Your creator application has been approved.</p><p>You now have access to the Books and Brews creator network.</p><p>Your access code will arrive in a separate email.</p>`
    });

    await resend(env, {
      to: lead.email,
      subject: 'Your Creator Access Code',
      html: `<h1>Creator Access Code</h1><p>Use this 6-digit code to log in:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p><p>Go to the creator portal and enter your email plus this code.</p><p>For security, do not share this code.</p>`
    });

    await env.LEADS_DB.prepare('INSERT INTO lead_notes (lead_id, note, created_at) VALUES (?, ?, ?)')
      .bind(params.id, `Creator approved. Login code generated: ${code}`, now)
      .run();
  }

  return json({ ok:true });
}

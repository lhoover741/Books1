function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

async function body(req) {
  try { return await req.json(); } catch { return {}; }
}

function parseCode(note='') {
  const m = note.match(/Client login code generated:\s*(\d{6})/i);
  return m ? m[1] : '';
}

function expired(t) {
  return Date.now() - new Date(t).getTime() > 86400000;
}

function token(email,id){
  return btoa(`${email}:${id}:${Date.now()}`);
}

export async function onRequestPost({request,env}) {
  const db = env.LEADS_DB || env.DB;
  const data = await body(request);

  const email = data.email?.toLowerCase().trim();
  const code = data.code?.trim();

  if(!email || !code) return json({ok:false,error:'Missing info'},400);

  const client = await db.prepare(
    "SELECT * FROM leads WHERE lower(email)=? AND form_type!='creator_application'"
  ).bind(email).first();

  if(!client) return json({ok:false,error:'Client not found'},404);

  const notes = await db.prepare(
    "SELECT note,created_at FROM lead_notes WHERE lead_id=? ORDER BY created_at DESC"
  ).bind(client.id).all();

  const entry = notes.results.find(n=>n.note.includes('Client login code generated'));

  if(!entry) return json({ok:false,error:'No code found'},403);
  if(expired(entry.created_at)) return json({ok:false,error:'Code expired'},403);

  const stored = parseCode(entry.note);

  if(code !== stored) return json({ok:false,error:'Invalid code'},401);

  return json({
    ok:true,
    token: token(email,client.id),
    lead_id: client.id
  });
}
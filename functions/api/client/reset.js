function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{'content-type':'application/json'}
  });
}

async function body(r){
  try{return await r.json()}catch{return{}}
}

function gen(){
  const a=new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0]%1000000).padStart(6,'0');
}

async function send(env,to,code){
  if(!env.RESEND_API_KEY)return;
  await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{
      Authorization:`Bearer ${env.RESEND_API_KEY}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      from:env.LEAD_FROM_EMAIL,
      to,
      subject:'Your Client Access Code',
      html:`<h1>${code}</h1><p>Expires in 24 hours</p>`
    })
  });
}

export async function onRequestPost({request,env}){
  const db = env.LEADS_DB || env.DB;
  const data = await body(request);

  const email = data.email?.toLowerCase().trim();
  if(!email) return json({ok:false,error:'Email required'},400);

  const client = await db.prepare(
    "SELECT * FROM leads WHERE lower(email)=? AND form_type!='creator_application'"
  ).bind(email).first();

  if(!client) return json({ok:false,error:'Not found'},404);

  const code = gen();

  await db.prepare(
    "INSERT INTO lead_notes (lead_id,note,created_at) VALUES (?,?,?)"
  ).bind(client.id,`Client login code generated: ${code}`,new Date().toISOString()).run();

  await send(env,email,code);

  return json({ok:true});
}
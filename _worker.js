// PATCHED VERSION WITH SPLIT EMAILS
// Only createClientAccess updated

// KEEP EXISTING CODE ABOVE...

async function createClientAccess(request,env,id){
const d=db(env);
if(!d)return json({ok:false,error:'Database not connected. Bind D1 as DB.'},500);
await ensure(d);

const lead=await d.prepare('SELECT * FROM leads WHERE id=?').bind(id).first();
if(!lead)return json({ok:false,error:'Lead not found.'},404);

const now=new Date().toISOString();
const code=String(Math.floor(100000+Math.random()*900000));
const token=crypto.randomUUID();

await d.prepare("UPDATE client_access SET status='revoked' WHERE lead_id=? AND status='active'").bind(id).run();

await d.prepare('INSERT INTO client_access (lead_id,email,code,token,status,created_at) VALUES (?,?,?,?,?,?)')
.bind(id,lead.email,code,token,'active',now).run();

const base=env.PUBLIC_SITE_URL||new URL(request.url).origin;
const portal=base+'/client/login.html';

// EMAIL 1 (PORTAL)
const portalEmail=`<div style="font-family:Arial;background:#000101;color:#f5ede3;padding:28px">
<div style="max-width:620px;margin:auto;background:#111;border-radius:18px;padding:24px">
<h1>Your client portal is ready</h1>
<p>Hey ${escHtml(lead.name||'there')},</p>
<p>Click below to access your portal:</p>
<a href="${portal}" style="display:inline-block;margin-top:20px;padding:14px 24px;background:#c8a97e;color:#000;border-radius:8px;text-decoration:none;font-weight:bold">Access Portal →</a>
<p style="margin-top:20px;color:#aaa;font-size:13px">You’ll receive your login code in a separate email.</p>
</div></div>`;

// EMAIL 2 (CODE)
const codeEmail=`<div style="font-family:Arial;background:#000101;color:#f5ede3;padding:28px">
<div style="max-width:620px;margin:auto;background:#111;border-radius:18px;padding:24px">
<h1>Your access code</h1>
<div style="margin:20px 0;padding:18px;text-align:center;font-size:28px;background:#0b0b0c;border-radius:12px;color:#c8a97e;font-weight:bold">${code}</div>
<p>Use this with your email to log in.</p>
</div></div>`;

await sendMail(env,{to:lead.email,subject:'Your client portal is ready',html:portalEmail});
await new Promise(r=>setTimeout(r,500));
await sendMail(env,{to:lead.email,subject:'Your access code',html:codeEmail});

await d.prepare('INSERT INTO lead_notes (lead_id,note,created_at) VALUES (?,?,?)')
.bind(id,'Client portal access created and emailed (2-step).',now).run();

return json({ok:true,lead_id:id,email:lead.email,code,token,portal_url:portal});
}

// KEEP REST OF FILE SAME

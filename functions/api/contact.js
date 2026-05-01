function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

async function parseBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return await request.json();
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function priorityFromBudget(budget) {
  const b = (budget || '').toLowerCase();
  return b.includes('800+') || b.includes('600') || b.includes('5000') || b.includes('5,000') ? 'High' : 'Normal';
}

async function resend(env, payload) {
  if (!env.RESEND_API_KEY || !env.LEAD_FROM_EMAIL) return { skipped: true };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: env.LEAD_FROM_EMAIL, ...payload })
  });
  return { ok: res.ok, status: res.status };
}

async function sendEmail(env, lead) {
  if (!env.LEAD_NOTIFY_TO) return { skipped: true };
  const subject = `New Books and Brews ${lead.form_type} - ${lead.name}`;
  const html = `<h1>New Books and Brews Lead</h1><p>Name: ${lead.name}</p><p>Email: ${lead.email}</p><p>Phone: ${lead.phone || 'Not provided'}</p><p>Business: ${lead.business_name || 'Not provided'}</p><p>Project: ${lead.project_type || 'Not provided'}</p><p>Budget: ${lead.budget_range || 'Not provided'}</p><p>${lead.project_details || lead.message || ''}</p>`;
  return resend(env, { to: env.LEAD_NOTIFY_TO, reply_to: lead.email, subject, html });
}

async function sendCreatorApplicationReceived(env, lead) {
  const subject = 'Creator application received - Books and Brews';
  const html = `<h1>Application Received</h1><p>Hi ${lead.name || 'there'},</p><p>Thanks for applying to the Books and Brews creator network.</p><p>Your application was received and is pending admin review.</p><p>If approved, you will receive an approval email first. Your creator access code will be sent separately after approval.</p><p>No creator portal access is active until your application is approved.</p>`;
  return resend(env, { to: lead.email, subject, html });
}

async function sendCreatorNotification(env, creator, lead) {
  if (!creator.email) return { skipped: true, error: 'Creator email missing' };
  const subject = 'New lead opportunity from Books and Brews';
  const html = `<h1>New Lead Opportunity</h1><p>Hi ${creator.name || 'there'},</p><p>A client opportunity may be a good fit for you.</p><p><strong>Client:</strong> ${lead.name || 'Not provided'}</p><p><strong>Business:</strong> ${lead.business_name || 'Not provided'}</p><p><strong>Project:</strong> ${lead.project_type || 'Not provided'}</p><p><strong>Budget:</strong> ${lead.budget_range || 'Not provided'}</p><p><strong>Details:</strong> ${lead.project_details || lead.message || 'No details provided'}</p><p>Reply to Books and Brews if you want to move forward with this opportunity.</p>`;
  return resend(env, { to: creator.email, subject, html });
}

async function handleCreatorNotification(body, env) {
  const db = env.DB || env.LEADS_DB;
  if (!db) return json({ ok:false, error:'Missing database binding.' }, 500);
  const leadId = Number(body.lead_id);
  const creatorId = Number(body.creator_id);
  if (!leadId || !creatorId) return json({ ok:false, error:'Lead ID and creator ID are required.' }, 400);
  const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first();
  const creator = await db.prepare('SELECT * FROM leads WHERE id = ?').bind(creatorId).first();
  if (!lead || !creator) return json({ ok:false, error:'Lead or creator not found.' }, 404);
  const emailResult = await sendCreatorNotification(env, creator, lead).catch(e => ({ ok:false, error:String(e) }));
  const now = new Date().toISOString();
  const status = emailResult.ok ? 'sent' : (emailResult.skipped ? 'skipped' : 'failed');
  await db.prepare('INSERT INTO lead_notes (lead_id, note, created_at) VALUES (?, ?, ?)').bind(leadId, `Creator notification ${status}: ${creator.name || creator.email || creatorId}.`, now).run();
  await db.prepare('INSERT INTO lead_notes (lead_id, note, created_at) VALUES (?, ?, ?)').bind(creatorId, `Lead opportunity notification ${status}: ${lead.name || lead.email || leadId}.`, now).run();
  return json({ ok:true, emailResult });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await parseBody(request);
    if (body.action === 'creator_notification') return await handleCreatorNotification(body, env);

    const now = new Date().toISOString();
    const budget = clean(body.budgetRange || body.budget_range || body.budget);
    const lead = {
      form_type: clean(body.formType || body.form_type || 'contact'),
      name: clean(body.name),
      email: clean(body.email),
      phone: clean(body.phone),
      business_name: clean(body.businessName || body.business_name || body.business),
      project_type: clean(body.projectType || body.project_type || body.creatorType),
      budget_range: budget,
      message: clean(body.message),
      project_details: clean(body.projectDetails || body.project_details || body.details || body.portfolioLink || body.idealClients),
      source_page: clean(body.sourcePage || request.headers.get('referer') || ''),
      status: 'New',
      priority: priorityFromBudget(budget),
      submitted_at: now,
      updated_at: now
    };
    if (!lead.name || !lead.email) return json({ ok:false, error:'Name and email are required.' }, 400);

    let id = null;
    const db = env.DB || env.LEADS_DB;
    if (db) {
      const result = await db.prepare(`INSERT INTO leads (form_type,name,email,phone,business_name,project_type,budget_range,message,project_details,source_page,status,priority,submitted_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(lead.form_type, lead.name, lead.email, lead.phone, lead.business_name, lead.project_type, lead.budget_range, lead.message, lead.project_details, lead.source_page, lead.status, lead.priority, lead.submitted_at, lead.updated_at).run();
      id = result.meta?.last_row_id || null;
    }

    const emailResult = await sendEmail(env, lead).catch(e => ({ ok:false, error:String(e) }));
    let applicantEmailResult = null;
    if (lead.form_type === 'creator_application') {
      applicantEmailResult = await sendCreatorApplicationReceived(env, lead).catch(e => ({ ok:false, error:String(e) }));
    }
    return json({ ok:true, id, message:'Thanks. Your request was received.', dbSaved:Boolean(id), emailResult, applicantEmailResult });
  } catch (error) {
    return json({ ok:false, error:String(error) }, 500);
  }
}

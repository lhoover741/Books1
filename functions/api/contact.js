
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
  return b.includes('5,000') || b.includes('5000') || b.includes('15k') || b.includes('$5') ? 'High' : 'Normal';
}

async function sendEmail(env, lead) {
  if (!env.RESEND_API_KEY || !env.LEAD_NOTIFY_TO || !env.LEAD_FROM_EMAIL) return { skipped: true };
  const subject = `New ${lead.form_type === 'quote' ? 'Quote Request' : 'Contact Lead'} - ${lead.name}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#000101;color:#f5ede3;padding:24px">
      <div style="max-width:640px;margin:auto;background:#101112;border:1px solid #49595A;border-radius:18px;padding:24px">
        <h1 style="color:#97AFB0;margin-top:0">New Books and Brews Lead</h1>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
        <p><strong>Business:</strong> ${lead.business_name || 'Not provided'}</p>
        <p><strong>Project:</strong> ${lead.project_type || 'Not provided'}</p>
        <p><strong>Budget:</strong> ${lead.budget_range || 'Not provided'}</p>
        <p><strong>Priority:</strong> ${lead.priority}</p>
        <hr style="border-color:#49595A">
        <p>${lead.project_details || lead.message || ''}</p>
      </div>
    </div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.LEAD_FROM_EMAIL,
      to: env.LEAD_NOTIFY_TO,
      reply_to: lead.email,
      subject,
      html
    })
  });
  return { ok: res.ok, status: res.status };
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await parseBody(request);
    const now = new Date().toISOString();
    const lead = {
      form_type: clean(body.formType || body.form_type || 'contact'),
      name: clean(body.name),
      email: clean(body.email),
      phone: clean(body.phone),
      business_name: clean(body.businessName || body.business_name),
      project_type: clean(body.projectType || body.project_type),
      budget_range: clean(body.budgetRange || body.budget_range),
      message: clean(body.message),
      project_details: clean(body.projectDetails || body.project_details),
      source_page: clean(body.sourcePage || request.headers.get('referer') || ''),
      status: 'New',
      priority: priorityFromBudget(clean(body.budgetRange || body.budget_range)),
      submitted_at: now,
      updated_at: now
    };
    if (!lead.name || !lead.email) return json({ ok:false, error:'Name and email are required.' }, 400);

    let id = null;
    if (env.LEADS_DB) {
      const result = await env.LEADS_DB.prepare(`
        INSERT INTO leads (form_type,name,email,phone,business_name,project_type,budget_range,message,project_details,source_page,status,priority,submitted_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(lead.form_type, lead.name, lead.email, lead.phone, lead.business_name, lead.project_type, lead.budget_range, lead.message, lead.project_details, lead.source_page, lead.status, lead.priority, lead.submitted_at, lead.updated_at).run();
      id = result.meta?.last_row_id || null;
    }
    const emailResult = await sendEmail(env, lead).catch(e => ({ ok:false, error:String(e) }));
    return json({ ok:true, id, message:'Thanks. Your request was received.', emailResult });
  } catch (error) {
    return json({ ok:false, error:String(error) }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function parseBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return await request.json();
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

function getDb(env) {
  return env.DB || env.LEADS_DB || null;
}

function priorityFromBudget(budget) {
  const b = (budget || '').toLowerCase();
  return b.includes('800+') || b.includes('600') || b.includes('5000') || b.includes('5,000') ? 'High' : 'Normal';
}

async function saveLead(request, env) {
  const body = await parseBody(request);
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

  if (!lead.name || !lead.email) return json({ ok: false, error: 'Name and email are required.' }, 400);

  let id = null;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database not connected. Bind D1 as DB.' }, 500);

  const result = await db.prepare('INSERT INTO leads (form_type,name,email,phone,business_name,project_type,budget_range,message,project_details,source_page,status,priority,submitted_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(lead.form_type, lead.name, lead.email, lead.phone, lead.business_name, lead.project_type, lead.budget_range, lead.message, lead.project_details, lead.source_page, lead.status, lead.priority, lead.submitted_at, lead.updated_at)
    .run();
  id = result.meta?.last_row_id || null;

  return json({ ok: true, id, dbSaved: Boolean(id), message: 'Thanks. Your request was received.' });
}

async function listLeads(env) {
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database not connected. Bind D1 as DB.' }, 500);

  const result = await db.prepare('SELECT id, form_type, name, email, phone, business_name, project_type, budget_range, message, project_details, source_page, status, priority, submitted_at, updated_at FROM leads ORDER BY submitted_at DESC LIMIT 100').all();
  return json({ ok: true, leads: result.results || [] });
}

async function updateLeadStatus(request, env, id) {
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database not connected. Bind D1 as DB.' }, 500);

  const body = await parseBody(request);
  const status = clean(body.status);
  if (!status) return json({ ok: false, error: 'Status is required.' }, 400);

  const now = new Date().toISOString();
  await db.prepare('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?').bind(status, now, id).run();
  return json({ ok: true, id, status });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    try {
      if (path === '/api/contact' && request.method === 'POST') {
        return await saveLead(request, env);
      }

      if (path === '/api/leads' && request.method === 'GET') {
        return await listLeads(env);
      }

      const leadMatch = path.match(/^\/api\/leads\/(\d+)$/);
      if (leadMatch && request.method === 'PATCH') {
        return await updateLeadStatus(request, env, leadMatch[1]);
      }

      if (path.startsWith('/api/')) {
        return json({ ok: false, error: 'API route not found.' }, 404);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ ok: false, error: String(error) }, 500);
    }
  }
};

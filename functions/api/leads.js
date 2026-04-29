function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

function getDb(env) {
  return env.DB || env.LEADS_DB || null;
}

export async function onRequestGet({ env }) {
  try {
    const db = getDb(env);
    if (!db) {
      return json({ ok: false, error: 'Database not connected. Bind your D1 database as DB in Cloudflare Pages.' }, 500);
    }

    const result = await db.prepare(`
      SELECT id, form_type, name, email, phone, business_name, project_type, budget_range, message, project_details, source_page, status, priority, submitted_at, updated_at
      FROM leads
      ORDER BY submitted_at DESC
      LIMIT 100
    `).all();

    return json({ ok: true, leads: result.results || [] });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}

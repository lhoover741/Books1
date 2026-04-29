export async function onRequestPost(context) {
  const { request, env } = context;

  const db = env.DB;
  const payload = await request.text();

  let event;

  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid", { status: 400 });
  }

  const type = event.type;

  if (
    type === "checkout.session.completed" ||
    type === "payment_intent.succeeded"
  ) {
    const obj = event.data.object;
    const meta = obj.metadata || {};

    const leadId = meta.lead_id;
    const invoiceNumber = meta.invoice_number;

    if (leadId && invoiceNumber) {
      const now = new Date().toISOString();

      await db.prepare(`
        UPDATE invoices
        SET status='Paid', paid_at=?, updated_at=?
        WHERE lead_id=? AND invoice_number LIKE ?
      `).bind(now, now, leadId, `%${invoiceNumber}%`).run();

      await db.prepare(`
        UPDATE leads
        SET status='Won', updated_at=?
        WHERE id=?
      `).bind(now, leadId).run();
    }
  }

  return new Response("ok");
}
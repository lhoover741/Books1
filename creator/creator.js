const emailKey = 'bb_creator_email';
const tokenKey = 'bb_creator_token';
const leadKey = 'bb_creator_lead';

function logout() {
  localStorage.clear();
  location.href = '/creator/login.html';
}

async function validateSession() {
  const email = localStorage.getItem(emailKey);
  const token = localStorage.getItem(tokenKey);
  const leadId = localStorage.getItem(leadKey);

  if (!email || !token || !leadId) return false;

  try {
    const res = await fetch('/api/creator/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, token, lead_id: leadId })
    });

    const data = await res.json();
    return res.ok && data.ok;
  } catch {
    return false;
  }
}

async function init() {
  const valid = await validateSession();
  if (!valid) return logout();
  load();
  poll();
}

if (location.pathname.includes('dashboard')) {
  init();
}

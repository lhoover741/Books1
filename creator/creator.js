const emailKey = 'bb_creator_email';
const tokenKey = 'bb_creator_token';
const leadKey = 'bb_creator_lead';

let leadCache = null;
let lastMessageCount = 0;

function logout() {
  localStorage.clear();
  location.href = '/creator/login.html';
}

function authHeaders() {
  return {
    'x-portal-token': localStorage.getItem(tokenKey)
  };
}

async function load() {
  const email = localStorage.getItem(emailKey);
  const token = localStorage.getItem(tokenKey);
  const leadId = localStorage.getItem(leadKey);

  if (!email || !token || !leadId) return logout();

  try {
    const res = await fetch(`/api/portal/lead/${leadId}`, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok || !data.ok) throw new Error();

    leadCache = data.lead;

    // Header
    name.textContent = leadCache.name;
    status.textContent = `Status: ${leadCache.status}`;
    statusShort.textContent = leadCache.status;

    // Dynamic next step
    if (leadCache.status === 'Approved') {
      nextAction.textContent = 'You are approved 🎉';
    } else if (data.notes.length === 0) {
      nextAction.textContent = 'Submit your first content';
    } else {
      nextAction.textContent = 'Awaiting review';
    }

    renderMessages(data.messages || []);
    renderFeed(data.notes || []);
    renderOnboarding(leadCache.status);
    updateStats(data);

  } catch (e) {
    logout();
  }
}

function renderFeed(items) {
  creatorFeed.innerHTML = items.map(i => `
    <div class="item">
      <strong>${i.note}</strong>
      <div style="font-size:12px;opacity:.6">${new Date(i.created_at).toLocaleString()}</div>
    </div>
  `).join('');

  submissionCount.textContent = items.length;
}

function updateStats(data) {
  let score = 0;

  if (creatorBrand.value) score += 25;
  if (creatorBio.value) score += 25;
  if (creatorPortfolio.value) score += 25;
  if (data.notes.length) score += 25;

  profileScore.textContent = score + '%';
  profileBar.style.width = score + '%';
}

function renderOnboarding(status) {
  onboarding.innerHTML = `
    <div class="step active">Profile Setup</div>
    <div class="step ${status !== 'New' ? 'active' : ''}">Review</div>
    <div class="step ${status === 'Approved' ? 'active' : ''}">Approved</div>
  `;
}

function renderMessages(msgs) {
  messages.innerHTML = msgs.map(m => `
    <div class="item">
      <strong>${m.direction === 'incoming' ? 'You' : 'Books and Brews'}</strong><br>
      ${m.message}
    </div>
  `).join('');

  lastMessageCount = msgs.length;
}

async function saveProfile() {
  if (!leadCache) return;

  await fetch(`/api/leads/${leadCache.id}/note`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      note: `Profile: ${creatorBrand.value} | ${creatorNiche.value} | ${creatorBio.value} | ${creatorPortfolio.value}`
    })
  });

  profileMsg.textContent = 'Saved ✔';
  load();
}

async function submitContent() {
  if (!leadCache) return;

  await fetch(`/api/leads/${leadCache.id}/note`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      note: contentLink.value
    })
  });

  submitMsg.textContent = 'Submitted ✔';
  load();
}

async function sendCreatorMessage() {
  if (!leadCache) return;

  creatorSendBtn.textContent = 'Sending...';

  await fetch(`/api/portal/lead/${leadCache.id}/message`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({
      message: creatorMessage.value,
      direction: 'incoming'
    })
  });

  creatorSendBtn.textContent = 'Send Message';
  creatorMessage.value = '';

  load();
}

// 🔥 REAL-TIME FEEL
async function poll() {
  const leadId = localStorage.getItem(leadKey);
  if (!leadId) return;

  const res = await fetch(`/api/portal/lead/${leadId}`, {
    headers: authHeaders()
  });

  const data = await res.json();

  if (data.messages.length !== lastMessageCount) {
    renderMessages(data.messages);
  }

  setTimeout(poll, 2500);
}

if (location.pathname.includes('dashboard')) {
  load();
  poll();
}
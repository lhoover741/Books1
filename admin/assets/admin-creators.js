const creatorState = {
  creators: [],
  leads: [],
  feed: [],
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalize(value = '') {
  return String(value).toLowerCase().trim();
}

function creatorStatusClass(status = 'New') {
  return `status-pill status-${normalize(status).replace(/\s+/g, '-') || 'new'}`;
}

async function fetchLeadData() {
  const res = await fetch('/api/leads');
  if (!res.ok) throw new Error('Unable to load creator data');
  const data = await res.json();
  const all = data.leads || [];

  creatorState.creators = all.filter(l => l.form_type === 'creator_application');
  creatorState.leads = all.filter(l => l.form_type !== 'creator_application');
  creatorState.feed = creatorState.creators.filter(c => c.message || c.project_details || c.portfolioLink || c.creatorType);
}

function updateStats() {
  const creators = creatorState.creators;
  creatorTotal.textContent = creators.length;
  creatorPending.textContent = creators.filter(c => ['New', '', null, undefined].includes(c.status)).length;
  creatorApproved.textContent = creators.filter(c => c.status === 'Approved').length;
  creatorSubmissions.textContent = creatorState.feed.length;
}

function getFilteredCreators() {
  const search = normalize(creatorSearch?.value || '');
  const status = creatorStatus?.value || '';

  return creatorState.creators.filter(c => {
    const searchable = normalize([
      c.name,
      c.email,
      c.creatorType,
      c.project_type,
      c.budget_range,
      c.message,
      c.project_details,
      c.business_name,
      c.portfolioLink,
      c.idealClients,
    ].filter(Boolean).join(' '));

    const statusMatch = !status || (c.status || 'New') === status;
    const searchMatch = !search || searchable.includes(search);
    return statusMatch && searchMatch;
  });
}

function renderCreators() {
  const creators = getFilteredCreators();

  if (!creators.length) {
    creatorRows.innerHTML = `
      <div class="empty-state">
        <strong>No creators found</strong>
        <p>Try clearing your search or changing the status filter.</p>
      </div>
    `;
    return;
  }

  creatorRows.innerHTML = creators.map(c => {
    const status = c.status || 'New';
    const creatorType = c.creatorType || c.project_type || 'Creator';
    const portfolio = c.portfolioLink || c.website || '';
    const notes = c.message || c.project_details || 'No application notes provided yet.';
    const idealClients = c.idealClients || c.business_name || 'Not specified';

    return `
      <div class="creator-card pro-creator-card">
        <div class="creator-card-top">
          <div>
            <strong>${escapeHtml(c.name || 'Unnamed Creator')}</strong>
            <span>${escapeHtml(c.email || 'No email')}</span>
          </div>
          <span class="${creatorStatusClass(status)}">${escapeHtml(status)}</span>
        </div>

        <div class="creator-meta-grid">
          <div><small>Type</small><b>${escapeHtml(creatorType)}</b></div>
          <div><small>Ideal Clients</small><b>${escapeHtml(idealClients)}</b></div>
        </div>

        <p class="creator-note-preview">${escapeHtml(notes)}</p>

        ${portfolio ? `<a class="creator-link" href="${escapeHtml(portfolio)}" target="_blank" rel="noopener">Open portfolio</a>` : `<span class="creator-link muted-link">No portfolio link</span>`}

        <div class="creator-actions">
          <button onclick="location.href='creator-detail.html?id=${c.id}'">View Profile</button>
          <button onclick="updateStatus(${c.id},'Approved')">Approve</button>
          <button onclick="updateStatus(${c.id},'Needs Work')">Needs Work</button>
          <button onclick="updateStatus(${c.id},'Rejected')">Reject</button>
        </div>
      </div>
    `;
  }).join('');
}

function scoreMatch(lead, creator) {
  const leadText = normalize([lead.project_type, lead.message, lead.project_details, lead.business_name].filter(Boolean).join(' '));
  const creatorText = normalize([creator.creatorType, creator.project_type, creator.message, creator.project_details, creator.idealClients, creator.business_name].filter(Boolean).join(' '));
  const keywords = ['hair', 'hairstylist', 'barber', 'beauty', 'brand', 'website', 'landing', 'seo', 'ecommerce', 'shop', 'local', 'small business'];
  let score = 0;
  keywords.forEach(word => { if (leadText.includes(word) && creatorText.includes(word)) score += 2; });
  if (lead.project_type && creator.project_type && normalize(lead.project_type) === normalize(creator.project_type)) score += 5;
  if (lead.budget_range && normalize(lead.budget_range).includes('premium')) score += 1;
  return score;
}

function renderMatches() {
  const creators = creatorState.creators.filter(c => c.status === 'Approved');
  const matches = [];
  creatorState.leads.forEach(lead => creators.forEach(c => { const score = scoreMatch(lead, c); if (score > 0) matches.push({ lead, c, score }); }));
  matches.sort((a, b) => b.score - a.score);
  if (!matches.length) { matchRows.innerHTML = `<div class="empty-state"><strong>No suggested matches yet</strong><p>Approved creators and client leads will appear here when their details line up.</p></div>`; return; }
  matchRows.innerHTML = matches.slice(0, 12).map(m => `
    <div class="match-card">
      <div><strong>${escapeHtml(m.lead.name || 'Client Lead')}</strong><span>${escapeHtml(m.lead.project_type || 'Website project')}</span></div>
      <div class="match-arrow">→</div>
      <div><strong>${escapeHtml(m.c.name || 'Creator')}</strong><span>Match score: ${m.score}</span></div>
      <button onclick="sendMatch(${m.lead.id},${m.c.id})">Send Lead Email</button>
    </div>`).join('');
}

function renderFeed() {
  const items = creatorState.feed;
  if (!items.length) { creatorFeed.innerHTML = `<div class="empty-state"><strong>No creator submissions yet</strong><p>Creator application details and submitted notes will appear here.</p></div>`; return; }
  creatorFeed.innerHTML = items.map(i => `<div class="feed-item"><strong>${escapeHtml(i.name || 'Creator')}</strong><span>${escapeHtml(i.email || '')}</span><p>${escapeHtml(i.message || i.project_details || 'No notes provided.')}</p></div>`).join('');
}

async function loadCreators() {
  try {
    creatorRows.innerHTML = '<div class="empty-state"><strong>Loading creators...</strong></div>';
    await fetchLeadData();
    updateStats();
    renderCreators();
    renderFeed();
    renderMatches();
  } catch (error) {
    creatorRows.innerHTML = `<div class="empty-state error"><strong>Could not load creators</strong><p>${escapeHtml(error.message)}</p></div>`;
  }
}

async function loadMatches() { if (!creatorState.creators.length && !creatorState.leads.length) await fetchLeadData(); renderMatches(); }

async function sendMatch(leadId, creatorId) {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: 'creator_notification',
      lead_id: leadId,
      creator_id: creatorId
    })
  });

  const data = await res.json().catch(() => ({}));

  if (res.ok && data.ok) {
    alert('Lead email sent to creator and activity logged.');
  } else {
    alert(data.error || 'Something went wrong sending the creator notification.');
  }
}

async function updateStatus(id, status) { await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) }); await loadCreators(); }
async function loadFeed() { if (!creatorState.creators.length) await fetchLeadData(); renderFeed(); }
function wireCreatorControls() { creatorSearch?.addEventListener('input', renderCreators); creatorStatus?.addEventListener('change', renderCreators); refreshCreators?.addEventListener('click', loadCreators); refreshCreatorList?.addEventListener('click', loadCreators); refreshMatches?.addEventListener('click', loadMatches); refreshFeed?.addEventListener('click', loadFeed); }
if (location.pathname.includes('creators')) { wireCreatorControls(); loadCreators(); }

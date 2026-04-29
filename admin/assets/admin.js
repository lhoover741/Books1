
const rows = document.getElementById('leadRows');
const errorBox = document.getElementById('error');
const stats = { total: document.getElementById('total'), new: document.getElementById('new'), quote: document.getElementById('quote'), high: document.getElementById('high') };

function esc(v){ return String(v ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
function date(v){ return v ? new Date(v).toLocaleString() : ''; }

function openLeadModal(lead){
  let overlay = document.querySelector('.lead-manage-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.className = 'lead-manage-overlay';
    overlay.innerHTML = `<div class="lead-manage-modal"><div class="manage-head"><div><p class="manage-kicker">Manage Lead</p><h2>${esc(lead.name)}</h2><p>${esc(lead.email)}</p></div><button class="manage-close">Close</button></div><div class="manage-body"><div class="manage-card"><h3>Lead Overview</h3><div class="manage-grid"><div class="manage-field"><span>Email</span><strong>${esc(lead.email)}</strong></div><div class="manage-field"><span>Phone</span><strong>${esc(lead.phone||'Not provided')}</strong></div><div class="manage-field"><span>Status</span><strong>${esc(lead.status)}</strong></div><div class="manage-field"><span>Priority</span><strong>${esc(lead.priority)}</strong></div><div class="manage-field"><span>Budget</span><strong>${esc(lead.budget_range)}</strong></div><div class="manage-field"><span>Submitted</span><strong>${esc(date(lead.submitted_at))}</strong></div></div></div></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.manage-close').onclick = () => overlay.classList.remove('open');
  }
  overlay.classList.add('open');
}

async function loadLeads(){
  errorBox.textContent=''; rows.innerHTML='<tr><td colspan="8">Loading...</td></tr>';
  try{
    const res=await fetch('/api/leads'); const data=await res.json();
    if(!res.ok || !data.ok) throw new Error(data.error || 'Unable to load leads.');
    const leads=data.leads || [];

    stats.total.textContent=leads.length;
    stats.new.textContent=leads.filter(l=>l.status==='New').length;
    stats.quote.textContent=leads.filter(l=>(l.form_type||'').includes('quote')).length;
    stats.high.textContent=leads.filter(l=>l.priority==='High').length;

    rows.innerHTML = leads.length ? leads.map(l => `
      <tr>
        <td>${esc(l.name)}</td>
        <td><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></td>
        <td>${esc(l.form_type)}</td>
        <td>${esc(l.budget_range)}</td>
        <td>${esc(l.status)}</td>
        <td>${esc(l.priority)}</td>
        <td>${esc(date(l.submitted_at))}</td>
        <td>
          <button class="status-btn" data-id="${l.id}" data-status="${esc(l.status)}">Update</button>
          <button class="manage-btn" data-manage="${l.id}">Manage</button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="8">No leads yet.</td></tr>';

    document.querySelectorAll('[data-manage]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.dataset.manage;
        const lead=leads.find(l=>l.id==id);
        openLeadModal(lead);
      });
    });

  }catch(e){ rows.innerHTML=''; errorBox.textContent=e.message; }
}

document.getElementById('refresh').addEventListener('click', loadLeads);
loadLeads();

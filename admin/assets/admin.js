
const rows = document.getElementById('leadRows');
const errorBox = document.getElementById('error');
const stats = { total: document.getElementById('total'), new: document.getElementById('new'), quote: document.getElementById('quote'), high: document.getElementById('high') };
function esc(v){ return String(v ?? '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
function date(v){ return v ? new Date(v).toLocaleString() : ''; }
async function updateStatus(id, current){
  const next = prompt('New status:', current || 'Contacted');
  if (!next) return;
  await fetch(`/api/leads/${id}`, { method:'PATCH', headers:{'content-type':'application/json'}, body:JSON.stringify({status:next}) });
  loadLeads();
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
    rows.innerHTML = leads.length ? leads.map(l => `<tr><td>${esc(l.name)}</td><td><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></td><td>${esc(l.form_type)}</td><td>${esc(l.budget_range)}</td><td>${esc(l.status)}</td><td>${esc(l.priority)}</td><td>${esc(date(l.submitted_at))}</td><td><button class="status-btn" data-id="${l.id}" data-status="${esc(l.status)}">Update</button></td></tr>`).join('') : '<tr><td colspan="8">No leads yet.</td></tr>';
    document.querySelectorAll('.status-btn').forEach(btn=>btn.addEventListener('click',()=>updateStatus(btn.dataset.id,btn.dataset.status)));
  }catch(e){ rows.innerHTML=''; errorBox.textContent=e.message; }
}
document.getElementById('refresh').addEventListener('click', loadLeads);
loadLeads();

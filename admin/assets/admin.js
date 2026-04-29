const rows = document.getElementById('leadRows');
const errorBox = document.getElementById('error');
const stats = { total: document.getElementById('total'), new: document.getElementById('new'), quote: document.getElementById('quote'), high: document.getElementById('high') };

function esc(v){ return String(v ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
function date(v){ return v ? new Date(v).toLocaleString() : ''; }
function today(){ return new Date().toISOString().slice(0,10); }

function historyList(items, empty, render){ return items && items.length ? items.map(render).join('') : `<p class="manage-muted">${empty}</p>`; }

async function postAction(id, type, data){
  const res = await fetch(`/api/leads/${id}/${type}`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(data) });
  const out = await res.json().catch(()=>({}));
  if(!res.ok || out.ok === false) throw new Error(out.error || 'Unable to save.');
  return out;
}

async function openLeadModal(lead){
  let overlay = document.querySelector('.lead-manage-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.className = 'lead-manage-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `<div class="lead-manage-modal"><div class="manage-head"><div><p class="manage-kicker">Admin CRM</p><h2>Manage Lead</h2><p>Loading lead details...</p></div><button class="manage-close">Close</button></div><div class="manage-body"><div class="manage-card"><p class="manage-muted">Loading full lead management system...</p></div></div></div>`;
  overlay.classList.add('open');
  overlay.querySelector('.manage-close').onclick = () => overlay.classList.remove('open');

  const res = await fetch(`/api/leads/${lead.id}`);
  const data = await res.json().catch(()=>({}));
  if(!res.ok || data.ok === false){
    overlay.querySelector('.manage-body').innerHTML = `<div class="manage-card"><p class="manage-muted">${esc(data.error || 'Unable to load lead.')}</p></div>`;
    return;
  }

  const l = data.lead || lead;
  const project = data.project || {};
  overlay.innerHTML = `
    <div class="lead-manage-modal">
      <div class="manage-head">
        <div>
          <p class="manage-kicker">Admin CRM</p>
          <h2>Manage Lead</h2>
          <p>Review the lead, update status, track progress, create invoices, manage files, schedule calls, and communicate with the client.</p>
        </div>
        <button class="manage-close">Close</button>
      </div>
      <div class="manage-body">
        <div class="manage-card">
          <p class="manage-kicker">Lead Overview</p>
          <h3>${esc(l.name)}</h3>
          <p class="manage-muted">${esc(l.email)} · ${esc(l.project_type || l.form_type)}</p>
          <div class="manage-grid">
            <div class="manage-field"><span>Email</span><strong>${esc(l.email)}</strong></div>
            <div class="manage-field"><span>Phone</span><strong>${esc(l.phone || 'Not provided')}</strong></div>
            <div class="manage-field"><span>Form Type</span><strong>${esc(l.form_type)}</strong></div>
            <div class="manage-field"><span>Status</span><strong>${esc(l.status)}</strong></div>
            <div class="manage-field"><span>Priority</span><strong>${esc(l.priority)}</strong></div>
            <div class="manage-field"><span>Submitted</span><strong>${esc(date(l.submitted_at))}</strong></div>
            <div class="manage-field"><span>Source Page</span><strong>${esc(l.source_page || 'Not provided')}</strong></div>
            <div class="manage-field"><span>Business</span><strong>${esc(l.business_name || 'Not provided')}</strong></div>
            <div class="manage-field"><span>Budget</span><strong>${esc(l.budget_range || 'Not provided')}</strong></div>
          </div>
          <div class="manage-actions"><a class="manage-btn" href="mailto:${esc(l.email)}">Email Lead</a><a class="manage-btn" href="/admin/index.html">Back to Leads</a><button class="manage-btn">Create Client Portal Access</button></div>
        </div>

        <div class="manage-card"><p class="manage-kicker">Pipeline Actions</p><h3>Update this lead</h3><div class="manage-form"><label>Lead Status</label><select id="modalStatus"><option>New</option><option>Contacted</option><option>Quoted</option><option>Won</option><option>Lost</option></select><button class="manage-btn primary" id="saveStatus">Save Status</button></div></div>

        <div class="manage-card"><p class="manage-kicker">Project Tracker</p><h3>Manage project progress</h3><div class="manage-form"><div class="manage-two"><div><label>Project Title</label><input id="projectTitle" value="${esc(project.title || 'Website Build')}"></div><div><label>Stage</label><select id="projectStage"><option>Inquiry Received</option><option>Planning</option><option>Design</option><option>Development</option><option>Review</option><option>Launch Ready</option><option>Completed</option></select></div></div><div class="manage-three"><div><label>Progress %</label><input id="projectProgress" type="number" min="0" max="100" value="${esc(project.progress || '0')}"></div><div><label>Target Date</label><input id="projectTarget" type="date" value="${esc(project.target_date || today())}"></div><div><label>Next Milestone</label><input id="projectMilestone" value="${esc(project.next_milestone || 'Homepage design review')}"></div></div><button class="manage-btn primary" id="saveProject">Save Project Tracker</button></div></div>

        <div class="manage-card"><p class="manage-kicker">Project Completion</p><h3>Final handoff</h3><div class="manage-form"><label>Final Delivery Message</label><textarea id="deliveryMsg">${esc(project.delivery_message || 'Your website has been completed and delivered. Thank you for working with Books and Brews.')}</textarea><label>Maintenance Offer</label><textarea id="maintenanceOffer">${esc(project.maintenance_offer || 'Ongoing maintenance and support are available if needed.')}</textarea><div class="manage-actions"><button class="manage-btn primary" id="markComplete">Mark Project Complete</button><button class="manage-btn" id="sendComplete">Send Completion Email</button></div></div></div>

        <div class="manage-card"><p class="manage-kicker">Invoices</p><h3>Create and manage invoices</h3><div class="manage-form"><div class="manage-three"><div><label>Invoice Number</label><input id="invoiceNumber" value="INV-${1000 + Number(l.id)}"></div><div><label>Amount</label><input id="invoiceAmount" placeholder="300.00"></div><div><label>Status</label><select id="invoiceStatus"><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select></div></div><div class="manage-three"><div><label>Invoice Type</label><select id="invoiceType"><option>Full</option><option>Deposit</option><option>Balance</option></select></div><div><label>Due Date</label><input id="invoiceDue" type="date" value="${today()}"></div><div><label>Payment Link</label><input id="invoiceLink" placeholder="https://..."></div></div><label>Notes</label><textarea id="invoiceNotes">Deposit for website build</textarea><button class="manage-btn primary" id="saveInvoice">Save Invoice</button></div><h3>Invoice History</h3>${historyList(data.invoices,'No invoices yet.',i=>`<p class="manage-muted">${esc(i.invoice_number)} · ${esc(i.amount)} · ${esc(i.status)}</p>`)}</div>

        <div class="manage-card"><p class="manage-kicker">Asset Center</p><h3>Upload and share files</h3><div class="manage-form"><label>File Name</label><input id="fileName" placeholder="Logo, contract, screenshot..."><label>File URL</label><input id="fileUrl" placeholder="https://..."><button class="manage-btn primary" id="saveFile">Save File</button></div><h3>Files</h3>${historyList(data.files,'No files uploaded yet.',f=>`<p class="manage-muted"><a href="${esc(f.file_url)}" target="_blank">${esc(f.file_name)}</a></p>`)}</div>

        <div class="manage-card"><p class="manage-kicker">Lead Details</p><h3>Project information</h3><div class="manage-grid"><div class="manage-field"><span>Business Name</span><strong>${esc(l.business_name || '—')}</strong></div><div class="manage-field"><span>Project Type</span><strong>${esc(l.project_type || '—')}</strong></div><div class="manage-field"><span>Budget Range</span><strong>${esc(l.budget_range || '—')}</strong></div></div><div class="manage-field" style="margin-top:12px"><span>Message</span><p>${esc(l.message || '—')}</p></div><div class="manage-field" style="margin-top:12px"><span>Project Details</span><p>${esc(l.project_details || '—')}</p></div></div>

        <div class="manage-card"><p class="manage-kicker">Internal Notes</p><h3>Track conversations</h3><div class="manage-form"><label>Add Note</label><textarea id="noteText" placeholder="Write an internal note about this lead..."></textarea><button class="manage-btn primary" id="saveNote">Add Note</button></div><h3>Notes History</h3>${historyList(data.notes,'No notes yet.',n=>`<p class="manage-muted">${esc(date(n.created_at))}: ${esc(n.note)}</p>`)}</div>

        <div class="manage-card"><p class="manage-kicker">Follow-Up System</p><h3>Set reminders</h3><div class="manage-form"><div class="manage-two"><div><label>Reminder Date & Time</label><input id="reminderAt" type="datetime-local"></div><div><label>Reminder Note</label><input id="reminderNote" placeholder="Optional reminder note"></div></div><button class="manage-btn primary" id="saveReminder">Set Reminder</button></div><h3>Upcoming Reminders</h3>${historyList(data.reminders,'No reminders set.',r=>`<p class="manage-muted">${esc(date(r.reminder_at))}: ${esc(r.note)}</p>`)}</div>

        <div class="manage-card"><p class="manage-kicker">Booking</p><h3>Schedule a call</h3><div class="manage-form"><div class="manage-two"><div><label>Name</label><input id="bookingName" value="${esc(l.name)}"></div><div><label>Email</label><input id="bookingEmail" value="${esc(l.email)}"></div></div><div class="manage-two"><div><label>Date</label><input id="bookingDate" type="date" value="${today()}"></div><div><label>Time</label><input id="bookingTime" type="time"></div></div><label>Call Notes</label><textarea id="bookingUrl" placeholder="Optional notes or meeting link"></textarea><button class="manage-btn primary" id="saveBooking">Schedule Call</button></div></div>

        <div class="manage-card"><p class="manage-kicker">Client Communication</p><h3>Send update to client</h3><div class="manage-form"><label>Subject</label><input id="clientSubject" value="Your project update from Books and Brews"><label>Message</label><textarea id="clientMessage" placeholder="Write your update to the client..."></textarea><button class="manage-btn primary" id="saveMessage">Send Update to Client</button></div></div>

        <div class="manage-card"><p class="manage-kicker">Inbox</p><h3>Client messages</h3>${historyList(data.messages,'No messages yet.',m=>`<p class="manage-muted">${esc(date(m.created_at))}: ${esc(m.subject)} — ${esc(m.message)}</p>`)}</div>
      </div>
    </div>`;

  overlay.querySelector('.manage-close').onclick = () => overlay.classList.remove('open');
  overlay.querySelector('#modalStatus').value = l.status || 'New';
  if(project.stage) overlay.querySelector('#projectStage').value = project.stage;

  overlay.querySelector('#saveStatus').onclick = async()=>{await fetch(`/api/leads/${l.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:overlay.querySelector('#modalStatus').value})}); overlay.classList.remove('open'); loadLeads();};
  overlay.querySelector('#saveProject').onclick = async()=>{await postAction(l.id,'project',{title:projectTitle.value,stage:projectStage.value,progress:projectProgress.value,target_date:projectTarget.value,next_milestone:projectMilestone.value,delivery_message:deliveryMsg.value,maintenance_offer:maintenanceOffer.value}); openLeadModal(l);};
  overlay.querySelector('#markComplete').onclick = async()=>{await fetch(`/api/leads/${l.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:'Won'})}); loadLeads(); openLeadModal({...l,status:'Won'});};
  overlay.querySelector('#saveInvoice').onclick = async()=>{await postAction(l.id,'invoice',{invoice_number:invoiceNumber.value,amount:invoiceAmount.value,status:invoiceStatus.value,invoice_type:invoiceType.value,due_date:invoiceDue.value,payment_link:invoiceLink.value,notes:invoiceNotes.value}); openLeadModal(l);};
  overlay.querySelector('#saveFile').onclick = async()=>{await postAction(l.id,'file',{file_name:fileName.value,file_url:fileUrl.value}); openLeadModal(l);};
  overlay.querySelector('#saveNote').onclick = async()=>{await postAction(l.id,'note',{note:noteText.value}); openLeadModal(l);};
  overlay.querySelector('#saveReminder').onclick = async()=>{await postAction(l.id,'reminder',{reminder_at:reminderAt.value,note:reminderNote.value}); openLeadModal(l);};
  overlay.querySelector('#saveBooking').onclick = async()=>{await postAction(l.id,'booking',{name:bookingName.value,email:bookingEmail.value,date:bookingDate.value,time:bookingTime.value,url:bookingUrl.value}); openLeadModal(l);};
  overlay.querySelector('#saveMessage').onclick = async()=>{await postAction(l.id,'message',{subject:clientSubject.value,message:clientMessage.value}); openLeadModal(l);};
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
    rows.innerHTML = leads.length ? leads.map(l => `<tr><td>${esc(l.name)}</td><td><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></td><td>${esc(l.form_type)}</td><td>${esc(l.budget_range)}</td><td>${esc(l.status)}</td><td>${esc(l.priority)}</td><td>${esc(date(l.submitted_at))}</td><td><button class="manage-btn" data-manage="${l.id}">Manage</button></td></tr>`).join('') : '<tr><td colspan="8">No leads yet.</td></tr>';
    document.querySelectorAll('[data-manage]').forEach(btn=>btn.addEventListener('click',()=>openLeadModal(leads.find(l=>l.id==btn.dataset.manage))));
  }catch(e){ rows.innerHTML=''; errorBox.textContent=e.message; }
}

document.getElementById('refresh').addEventListener('click', loadLeads);
const rt=document.getElementById('refreshTop'); if(rt) rt.addEventListener('click', loadLeads);
loadLeads();

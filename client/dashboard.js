const lead=new URLSearchParams(location.search).get('lead')||localStorage.getItem('bb_lead');
function esc(v){return String(v??'').replace(/[&<>]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]))}
function money(v){return '$'+Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function safeDate(v){try{return v?new Date(v).toLocaleString():''}catch(e){return ''}}
function logout(){localStorage.removeItem('bb_lead');localStorage.removeItem('bb_token');location.href='/client/login.html'}
async function sendReply(){
 const box=document.getElementById('replyMessage');
 const msg=box.value.trim();
 if(!msg)return;
 replyStatus.textContent='Sending...';
 try{
  const res=await fetch('/api/leads/'+lead+'/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subject:'Client Message',message:msg,direction:'incoming'})});
  if(!res.ok)throw new Error('Message failed');
  replyStatus.textContent='Message sent ✔';
  messages.innerHTML='<div class="portal-item"><strong>You</strong><br>'+esc(msg)+'</div>'+messages.innerHTML;
  box.value='';
 }catch(e){replyStatus.textContent='Failed to send. Please try again.'}
}
async function loadPortal(){
try{
 if(!lead)throw new Error('Session expired. Please login again.');
 const res=await fetch('/api/leads/'+lead);
 const data=await res.json();
 if(!res.ok||!data.ok)throw new Error(data.error||'Unable to load portal.');
 const l=data.lead||{};
 const project=data.project||{};
 const progress=Number(project.progress||0);
 intro.textContent='Welcome back, '+(l.name||'client')+'. Here is your current project snapshot.';
 clientName.textContent=l.name||'-';
 clientEmail.textContent=l.email||'-';
 business.textContent=l.business_name||'Not provided';
 projectTitle.textContent=project.title||l.project_type||'Website Project';
 details.textContent=l.project_details||l.message||'Project details will appear here as the project is updated.';
 status.textContent=l.status||'New';
 status2.textContent=l.status||'New';
 nextStep.textContent=project.next_milestone||'We are reviewing your project details and preparing the next step.';
 progressBar.style.width=Math.min(100,Math.max(0,progress))+'%';
 progressText.textContent=progress+'% complete';
 invoices.innerHTML=(data.invoices||[]).length?(data.invoices||[]).map(i=>'<div class="portal-item"><strong>'+esc(i.invoice_number)+'</strong><br>'+money(i.amount)+' · '+esc(i.status||'Draft')+(i.payment_link?'<br><a class="portal-pay" href="'+esc(i.payment_link)+'" target="_blank">Pay / View Invoice</a>':'')+'</div>').join(''):'<div class="portal-item">No invoices yet.<br><span class="microcopy">Invoices and payment links will appear here.</span></div>';
 files.innerHTML=(data.files||[]).length?(data.files||[]).map(f=>'<div class="portal-item"><a href="'+esc(f.file_url)+'" target="_blank">'+esc(f.file_name||'Open file')+'</a></div>').join(''):'<div class="portal-item">No files shared yet.<br><span class="microcopy">Contracts, previews, and deliverables will appear here.</span></div>';
 messages.innerHTML=(data.messages||[]).length?(data.messages||[]).map(m=>'<div class="portal-item"><strong>'+esc(m.subject||'Message')+'</strong><br>'+esc(m.message||'')+'</div>').join(''):'<div class="portal-item">No messages yet.<br><span class="microcopy">Start a conversation using the message box.</span></div>';
 const timelineItems=[...(data.notes||[]).map(n=>({t:n.created_at,l:n.note})),...(data.invoices||[]).map(i=>({t:i.created_at,l:'Invoice '+i.invoice_number+' created'})),...(data.files||[]).map(f=>({t:f.created_at,l:'File shared: '+f.file_name}))].sort((a,b)=>new Date(b.t)-new Date(a.t)).slice(0,8);
 timeline.innerHTML=timelineItems.length?timelineItems.map(i=>'<div class="timeline-item"><strong>'+safeDate(i.t)+'</strong>'+esc(i.l)+'</div>').join(''):'<div class="portal-item">No activity yet.<br><span class="microcopy">Project updates will appear here.</span></div>';
 portal.style.display='block';
}catch(e){error.classList.add('open');error.innerHTML='<h2>Unable to load portal</h2><p>'+esc(e.message)+'</p><a class="portal-pay" href="/client/login.html">Go to Login</a>'}
}
loadPortal();
setInterval(loadPortal,10000);

async function loadCreators(){
 const res=await fetch('/api/leads');
 const data=await res.json();
 const creators=(data.leads||[]).filter(l=>l.form_type==='creator_application');

 creatorTotal.textContent=creators.length;
 creatorPending.textContent=creators.filter(c=>c.status==='New').length;
 creatorApproved.textContent=creators.filter(c=>c.status==='Approved').length;

 creatorRows.innerHTML=creators.map(c=>`
   <div class="creator-card">
     <strong>${c.name}</strong>
     <span>${c.email}</span>
     <div class="creator-actions">
       <button onclick="updateStatus(${c.id},'Approved')">Approve</button>
       <button onclick="updateStatus(${c.id},'Rejected')">Reject</button>
       <button onclick="updateStatus(${c.id},'Needs Work')">Needs Work</button>
     </div>
   </div>
 `).join('');
}

async function loadMatches(){
 const res=await fetch('/api/leads');
 const data=await res.json();

 const leads=(data.leads||[]).filter(l=>l.form_type!=='creator_application');
 const creators=(data.leads||[]).filter(l=>l.form_type==='creator_application' && l.status==='Approved');

 const matches=[];

 leads.forEach(lead=>{
   creators.forEach(c=>{
     if((lead.project_type||'').toLowerCase().includes((c.project_type||'').toLowerCase())){
       matches.push({lead,c});
     }
   });
 });

 matchRows.innerHTML=matches.map(m=>`
  <div class="match-card">
    <strong>${m.lead.name}</strong>
    <span>→ ${m.c.name}</span>
    <button onclick="sendMatch(${m.lead.id},${m.c.id})">Send Lead</button>
  </div>
 `).join('');
}

async function sendMatch(leadId,creatorId){
 await fetch(`/api/leads/${leadId}/note`,{
   method:'POST',
   headers:{'content-type':'application/json'},
   body:JSON.stringify({note:`Matched with creator ID ${creatorId}`})
 });
 alert('Lead sent to creator');
}

async function updateStatus(id,status){
 await fetch(`/api/leads/${id}`,{
  method:'PATCH',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({status})
 });
 loadCreators();
}

async function loadFeed(){
 const res=await fetch('/api/leads');
 const data=await res.json();

 const items=[];
 data.leads.forEach(l=>{
   if(l.form_type==='creator_application' && l.message){
     items.push({name:l.name,content:l.message});
   }
 });

 creatorFeed.innerHTML=items.map(i=>`
  <div class="feed-item">
    <strong>${i.name}</strong>
    <p>${i.content}</p>
  </div>
 `).join('');

 creatorSubmissions.textContent=items.length;
}

if(location.pathname.includes('creators')){
 loadCreators();
 loadFeed();
 loadMatches();
}

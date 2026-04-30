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
}

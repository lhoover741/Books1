const emailKey='bb_creator_email';const tokenKey='bb_creator_token';const leadKey='bb_creator_lead';let leadCache=null;

function logout(){
 localStorage.removeItem(emailKey);
 localStorage.removeItem(tokenKey);
 localStorage.removeItem(leadKey);
 location.href='/creator/login.html';
}

async function load(){
 const email=localStorage.getItem(emailKey);
 const token=localStorage.getItem(tokenKey);
 const leadId=localStorage.getItem(leadKey);

 if(!email||!token||!leadId){
   return logout();
 }

 try{
   const res=await fetch('/api/leads/'+leadId,{cache:'no-store'});
   const data=await res.json();

   if(!res.ok||!data.ok||!data.lead){
     throw new Error('Invalid session');
   }

   if(data.lead.email.toLowerCase()!==email){
     throw new Error('Session mismatch');
   }

   leadCache=data.lead;

   name.textContent=leadCache.name;
   status.textContent='Status: '+leadCache.status;
   statusShort.textContent=leadCache.status;

   const bundle=data;

   renderMessages(bundle.messages||[]);
   renderOnboarding(leadCache.status);

 }catch(e){
   console.error(e);
   logout();
 }
}

function renderOnboarding(status){
 onboarding.innerHTML='\n  <div class="step active">Profile Setup</div>\n  <div class="step '+(status!=='New'?'active':'')+'">Review</div>\n  <div class="step '+(status==='Approved'?'active':'')+'">Approved</div>';
}

function renderMessages(msgs){
 messages.innerHTML=msgs.map(m=>
  '<div class="item"><strong>'+(m.direction==='incoming'?'You':'B&B')+'</strong><br>'+m.message+'</div>'
 ).join('');
}

async function saveProfile(){
 if(!leadCache)return;
 await fetch('/api/leads/'+leadCache.id+'/note',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({note:'Profile: '+creatorBrand.value+' | '+creatorNiche.value+' | '+creatorBio.value+' | '+creatorPortfolio.value})});
 profileMsg.textContent='Saved ✔';
}

async function submitContent(){
 if(!leadCache)return;
 await fetch('/api/leads/'+leadCache.id+'/note',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({note:'Content submitted: '+contentLink.value+' | '+contentNotes.value})});
 submitMsg.textContent='Submitted ✔';
}

async function sendCreatorMessage(){
 if(!leadCache)return;
 await fetch('/api/leads/'+leadCache.id+'/message',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({subject:'Creator Message',message:creatorMessage.value,direction:'incoming'})});
 chatMsg.textContent='Sent ✔';
 creatorMessage.value='';
 load();
}

if(location.pathname.includes('dashboard')) load();

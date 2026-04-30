document.getElementById('clientLoginForm').addEventListener('submit',async function(e){
 e.preventDefault();
 const msg=document.getElementById('clientLoginMsg');
 msg.textContent='Checking...';
 try{
   const res=await fetch('/api/client/login',{
     method:'POST',
     headers:{'content-type':'application/json'},
     body:JSON.stringify({email:clientEmail.value,code:clientCode.value})
   });
   const data=await res.json();
   if(!res.ok||!data.ok) throw new Error(data.error||'Login failed');
   localStorage.setItem('bb_token',data.token);
   localStorage.setItem('bb_lead',data.lead_id);
   location.href='/client/portal.html';
 }catch(err){msg.textContent=err.message;}
});
document.getElementById('clientLoginForm').addEventListener('submit',async function(e){
 e.preventDefault();
 const msg=document.getElementById('clientLoginMsg');
 msg.textContent='Checking...';
 try{
   const email=clientEmail.value.trim().toLowerCase();
   const res=await fetch('/api/client/login',{
     method:'POST',
     headers:{'content-type':'application/json'},
     body:JSON.stringify({email,code:clientCode.value.trim()})
   });
   const data=await res.json();
   if(!res.ok||!data.ok) throw new Error(data.error||'Login failed');
   localStorage.setItem('bb_token',data.token);
   localStorage.setItem('bb_lead',data.lead_id);
   localStorage.setItem('bb_email',email);
   location.href='/client/portal.html';
 }catch(err){msg.textContent=err.message;}
});

async function resetCode(){
 const msg=document.getElementById('clientLoginMsg');
 const email=clientEmail.value.trim().toLowerCase();
 if(!email){msg.textContent='Enter email first';return;}
 msg.textContent='Sending new code...';
 const res=await fetch('/api/client/reset',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});
 const data=await res.json();
 msg.textContent=(res.ok&&data.ok)?'New code sent to your email':(data.error||'Unable to send code');
}
window.resetCode=resetCode;
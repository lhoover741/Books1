function bbGetManagedLeadId(){
  var invoice=document.getElementById('invoiceNumber');
  if(invoice&&invoice.value){
    var n=Number(String(invoice.value).replace('INV-',''));
    if(n>=1000)return n-1000;
  }
  var modal=document.querySelector('.lead-manage-modal');
  if(modal){
    var text=modal.textContent||'';
    var match=text.match(/Lead ID\s*#?\s*(\d+)/i)||text.match(/INV-(\d+)/i);
    if(match){
      var val=Number(match[1]);
      return val>=1000?val-1000:val;
    }
  }
  return null;
}

function bbPortalAccessAttach(){
  document.querySelectorAll('.manage-btn').forEach(function(button){
    if(button.dataset.portalReady==='1') return;
    if((button.textContent||'').trim() !== 'Create Client Portal Access') return;
    button.dataset.portalReady='1';
    button.addEventListener('click', async function(event){
      event.preventDefault();
      event.stopPropagation();
      var leadId=bbGetManagedLeadId();
      if(!leadId){alert('Could not detect lead ID. Close and reopen Manage, then try again.');return;}
      var original=button.textContent;
      button.disabled=true;
      button.textContent='Sending portal access...';
      try{
        var res=await fetch('/api/leads/'+leadId+'/client-access',{method:'POST'});
        var data=await res.json();
        if(!res.ok||!data.ok)throw new Error(data.error||'Unable to send portal access.');
        button.textContent='Portal access sent';
        alert('Portal access sent through Resend. The client will receive the portal link and access code in separate emails.');
      }catch(err){
        button.textContent=original;
        alert(err.message||'Unable to send portal access.');
      }finally{
        setTimeout(function(){button.disabled=false;button.textContent=original;},2200);
      }
    });
  });
}
setInterval(bbPortalAccessAttach,700);

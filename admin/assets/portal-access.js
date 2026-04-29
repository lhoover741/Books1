function bbPortalAccessAttach(){
  document.querySelectorAll('.manage-btn').forEach(function(button){
    if(button.dataset.portalReady==='1') return;
    if((button.textContent||'').trim() !== 'Create Client Portal Access') return;
    button.dataset.portalReady='1';
    button.addEventListener('click', async function(){
      var modal = button.closest('.lead-manage-modal');
      var email = modal && modal.querySelector('a[href^="mailto:"]') ? modal.querySelector('a[href^="mailto:"]').getAttribute('href').replace('mailto:','') : '';
      var nameEl = modal ? modal.querySelector('.manage-card h3') : null;
      var name = nameEl ? nameEl.textContent.trim() : 'there';
      var subject = 'Your Books and Brews Client Portal Access';
      var body = 'Hi '+name+',%0D%0A%0D%0AYour Books and Brews client portal is ready.%0D%0A%0D%0ALogin page: '+location.origin+'/client/login.html%0D%0A%0D%0AUse the email address you submitted with your quote request. I will send your temporary password separately.%0D%0A%0D%0AThanks,%0D%0ABooks and Brews';
      if(email){ window.location.href='mailto:'+email+'?subject='+encodeURIComponent(subject)+'&body='+body; }
      else { alert('Client email was not found on this lead.'); }
      try{
        var invoice=document.getElementById('invoiceNumber');
        var leadId=invoice?Number(String(invoice.value).replace('INV-',''))-1000:null;
        if(leadId){
          await fetch('/api/leads/'+leadId+'/note',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({note:'Client portal access email prepared.'})});
        }
      }catch(e){}
    });
  });
}
setInterval(bbPortalAccessAttach,700);

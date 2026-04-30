function chatEscape(v){return String(v||'').replace(/[&<>]/g,function(s){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[s]})}
function chatDate(v){return v?new Date(v).toLocaleString():''}
function findLeadId(modal){
  var input=modal.querySelector('#invoiceNumber');
  if(input&&input.value){var n=Number(input.value.replace('INV-',''));if(n>=1000)return n-1000}
  return null;
}
function bubble(m){
  var client=m.direction==='incoming';
  return '<div class="crm-bubble '+(client?'client':'admin')+'"><b>'+(client?'Client':'Books and Brews')+'</b><p>'+chatEscape(m.message)+'</p><small>'+chatDate(m.created_at)+'</small></div>';
}
async function loadChat(modal,id){
  var feed=modal.querySelector('#crmChatFeed');
  if(!feed)return;
  var r=await fetch('/api/leads/'+id,{cache:'no-store'});
  var d=await r.json();
  var msgs=d.messages||[];
  feed.innerHTML=msgs.length?msgs.map(bubble).join(''):'<p class="manage-muted">No messages yet.</p>';
}
async function sendAdminChat(modal,id){
  var box=modal.querySelector('#crmChatText');
  var status=modal.querySelector('#crmChatStatus');
  var msg=box.value.trim();
  if(!msg)return;
  status.textContent='Sending...';
  var r=await fetch('/api/leads/'+id+'/message',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({subject:'Books and Brews Reply',message:msg,direction:'outgoing'})});
  if(r.ok){box.value='';status.textContent='Reply sent';loadChat(modal,id)}else{status.textContent='Reply failed'}
}
function attachChat(){
  var modal=document.querySelector('.lead-manage-modal');
  if(!modal||modal.dataset.crmChat==='1')return;
  var id=findLeadId(modal);if(!id)return;
  var body=modal.querySelector('.manage-body');if(!body)return;
  modal.dataset.crmChat='1';
  var card=document.createElement('div');
  card.className='manage-card crm-chat-card';
  card.innerHTML='<p class="manage-kicker">Client Chat</p><h3>Conversation</h3><div id="crmChatFeed" class="crm-chat-feed"></div><textarea id="crmChatText" placeholder="Reply to client..."></textarea><button class="manage-btn primary" id="crmChatSend">Send Reply</button><p id="crmChatStatus" class="manage-muted"></p>';
  body.prepend(card);
  modal.querySelector('#crmChatSend').onclick=function(){sendAdminChat(modal,id)};
  loadChat(modal,id);
  setInterval(function(){if(document.body.contains(modal))loadChat(modal,id)},10000);
}
setInterval(attachChat,700);

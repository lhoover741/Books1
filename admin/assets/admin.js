// Updated invoice section to include Stripe buttons + handlers
// (full file retained, only relevant parts modified)

// In modal HTML replace invoice button block with:
// <button class="manage-btn primary" id="saveInvoice">Save Invoice</button>
// <button class="manage-btn primary" id="createStripeLink">Create Payment Link</button>
// <button class="manage-btn" id="createStripeInvoice">Create Stripe Invoice</button>

// Add after existing handlers:

overlay.querySelector('#createStripeLink').onclick = async()=>{
  const res = await fetch(`/api/leads/${l.id}/stripe/payment-link`, {
    method:'POST',
    headers:{'content-type':'application/json'},
    body: JSON.stringify({
      amount: invoiceAmount.value,
      invoice_number: invoiceNumber.value,
      invoice_type: invoiceType.value,
      due_date: invoiceDue.value
    })
  });
  const data = await res.json();
  if(data.url) window.open(data.url,'_blank');
  else alert(data.error||'Failed to create payment link');
};

overlay.querySelector('#createStripeInvoice').onclick = async()=>{
  const res = await fetch(`/api/leads/${l.id}/stripe/invoice`, {
    method:'POST',
    headers:{'content-type':'application/json'},
    body: JSON.stringify({
      amount: invoiceAmount.value,
      invoice_number: invoiceNumber.value,
      invoice_type: invoiceType.value,
      due_date: invoiceDue.value
    })
  });
  const data = await res.json();
  if(data.url) window.open(data.url,'_blank');
  else alert(data.error||'Failed to create invoice');
};

function bbMoney(value){
  return Number(String(value || '').replace('$','').replace(',','')) || 0;
}

function bbLeadId(){
  var input = document.getElementById('invoiceNumber');
  if (!input) return null;
  var number = Number(String(input.value).replace('INV-',''));
  return number >= 1000 ? number - 1000 : null;
}

function bbCalcSplit(){
  var totalInput = document.getElementById('bbTotalProjectAmount');
  var percentInput = document.getElementById('bbDepositPercent');
  var depositInput = document.getElementById('bbDepositAmount');
  var balanceInput = document.getElementById('bbBalanceAmount');
  if (!totalInput || !percentInput || !depositInput || !balanceInput) return;
  var total = bbMoney(totalInput.value);
  var percent = bbMoney(percentInput.value || '50');
  var deposit = total * (percent / 100);
  var balance = total - deposit;
  depositInput.value = deposit.toFixed(2);
  balanceInput.value = balance.toFixed(2);
}

async function bbCreateSplitLink(kind){
  var leadId = bbLeadId();
  if (!leadId) { alert('Could not detect lead id. Reopen Manage and try again.'); return; }

  bbCalcSplit();

  var total = bbMoney(document.getElementById('bbTotalProjectAmount').value);
  var percent = bbMoney(document.getElementById('bbDepositPercent').value || '50');
  var deposit = bbMoney(document.getElementById('bbDepositAmount').value);
  var balance = bbMoney(document.getElementById('bbBalanceAmount').value);

  var amount = total;
  var invoiceType = 'Full';
  var label = 'Full Payment';

  if (kind === 'deposit') { amount = deposit; invoiceType = 'Deposit'; label = percent + '% Deposit'; }
  if (kind === 'balance') { amount = balance; invoiceType = 'Balance'; label = 'Remaining Balance'; }

  if (!amount || amount <= 0) { alert('Amount must be greater than $0.'); return; }

  var invoiceNumber = document.getElementById('invoiceNumber').value + ' ' + label;
  var dueDate = document.getElementById('invoiceDue').value;
  var notes = document.getElementById('invoiceNotes').value || label;

  var response = await fetch('/api/leads/' + leadId + '/stripe/payment-link', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      amount: amount.toFixed(2),
      invoice_number: invoiceNumber,
      invoice_type: invoiceType,
      due_date: dueDate,
      total_project_amount: total.toFixed(2),
      deposit_percent: String(percent),
      balance_due_amount: balance.toFixed(2),
      remaining_balance: balance.toFixed(2),
      notes: notes
    })
  });

  var data = await response.json();
  if (!response.ok || data.ok === false) { alert(data.error || 'Unable to create link.'); return; }
  if (data.url) window.open(data.url, '_blank');
  alert(label + ' link created and saved.');
}

function bbInjectBilling(){
  if (document.getElementById('bbSplitBilling')) return;
  var cards = document.querySelectorAll('.manage-card');
  var invoiceCard = null;
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].textContent.indexOf('Create and manage invoices') !== -1) invoiceCard = cards[i];
  }
  if (!invoiceCard) return;

  var box = document.createElement('div');
  box.id = 'bbSplitBilling';
  box.className = 'manage-card';
  box.innerHTML = '<p class="manage-kicker">Split Payment Flow</p><h3>Auto deposit + balance tracking</h3><div class="manage-form"><div class="manage-three"><div><label>Total Project Amount</label><input id="bbTotalProjectAmount" placeholder="500.00"></div><div><label>Deposit Percent</label><input id="bbDepositPercent" value="50"></div><div><label>Deposit Amount</label><input id="bbDepositAmount" readonly></div></div><div class="manage-two"><div><label>Remaining Balance</label><input id="bbBalanceAmount" readonly></div><div><label>Flow</label><select><option>Deposit first</option><option>Full payment</option><option>Balance only</option></select></div></div><div class="manage-actions"><button class="manage-btn primary" id="bbDepositBtn">Create Deposit Link</button><button class="manage-btn" id="bbBalanceBtn">Create Balance Link</button><button class="manage-btn" id="bbFullBtn">Create Full Payment Link</button></div></div>';
  invoiceCard.parentNode.insertBefore(box, invoiceCard.nextSibling);

  document.getElementById('bbTotalProjectAmount').addEventListener('input', bbCalcSplit);
  document.getElementById('bbDepositPercent').addEventListener('input', bbCalcSplit);
  document.getElementById('bbDepositBtn').onclick = function(){ bbCreateSplitLink('deposit'); };
  document.getElementById('bbBalanceBtn').onclick = function(){ bbCreateSplitLink('balance'); };
  document.getElementById('bbFullBtn').onclick = function(){ bbCreateSplitLink('full'); };

  var baseAmount = document.getElementById('invoiceAmount');
  if (baseAmount && baseAmount.value) document.getElementById('bbTotalProjectAmount').value = baseAmount.value;
  bbCalcSplit();
}

setInterval(bbInjectBilling, 1000);

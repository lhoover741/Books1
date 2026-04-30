document.querySelectorAll('.menu-toggle').forEach(btn=>btn.addEventListener('click',()=>{const nav=document.querySelector('.mobile-nav'); if(nav) nav.classList.toggle('open')}));

document.querySelectorAll('form[action="/api/contact"]').forEach(form=>{form.addEventListener('submit',async e=>{e.preventDefault();const msg=form.querySelector('.form-response')||form.querySelector('.form-status'); if(msg) msg.textContent='Sending...'; try{const res=await fetch('/api/contact',{method:'POST',body:new FormData(form)});const data=await res.json().catch(()=>({})); if(!res.ok||data.ok===false) throw new Error(data.error||'Unable to send.'); if(msg) msg.textContent=data.message||'Thanks. Your message was received.'; form.reset();}catch(err){if(msg) msg.textContent=err.message||'Unable to send right now.'}})});

// Footer consistency: keep public pages using one clean navigation system.
(() => {
  const footerLinks = document.querySelector('.footer-links');
  if (!footerLinks) return;

  const links = [
    ['Home', '/index.html'],
    ['About', '/about.html'],
    ['Services', '/services.html'],
    ['Portfolio', '/portfolio.html'],
    ['Request a Quote', '/quote.html'],
    ['Apply as a Creator', '/creator.html'],
    ['Creator Login', '/creator/login.html'],
    ['Contact', '/contact.html']
  ];

  footerLinks.innerHTML = links.map(([label, href]) => `<a href="${href}">${label}</a>`).join('');

  const footerText = document.querySelector('.footer p');
  if (footerText) footerText.textContent = 'Smart websites. Smooth experience.';
})();

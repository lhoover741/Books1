document.querySelectorAll('.menu-toggle').forEach(btn=>btn.addEventListener('click',()=>{const nav=document.querySelector('.mobile-nav'); if(nav) nav.classList.toggle('open')}));

document.querySelectorAll('form[action="/api/contact"]').forEach(form=>{form.addEventListener('submit',async e=>{e.preventDefault();const msg=form.querySelector('.form-response')||form.querySelector('.form-status'); if(msg) msg.textContent='Sending...'; try{const res=await fetch('/api/contact',{method:'POST',body:new FormData(form)});const data=await res.json().catch(()=>({})); if(!res.ok||data.ok===false) throw new Error(data.error||'Unable to send.'); if(msg) msg.textContent=data.message||'Thanks. Your message was received.'; form.reset();}catch(err){if(msg) msg.textContent=err.message||'Unable to send right now.'}})});

// Upgraded footer: consistent, clearer, and conversion-focused across public pages.
(() => {
  const footer = document.querySelector('.footer');
  if (!footer) return;

  footer.classList.add('footer-upgraded');
  footer.innerHTML = `
    <div class="footer-brand-block">
      <a class="brand footer-brand" href="/index.html">
        <span class="brand-mark">☕</span>
        <span class="brand-text"><strong>BOOKS AND</strong><em>BREWS</em></span>
      </a>
      <p>Smart websites. Smooth experience.</p>
      <span class="footer-mini">Custom websites for service businesses, creators, and local brands.</span>
    </div>

    <div class="footer-column">
      <h4>Website Services</h4>
      <a href="/services.html">Services</a>
      <a href="/portfolio.html">Portfolio</a>
      <a href="/quote.html">Request a Quote</a>
      <a href="/contact.html">Contact</a>
    </div>

    <div class="footer-column">
      <h4>Portals</h4>
      <a href="/client/login.html">Client Portal</a>
      <a href="/creator.html">Apply as a Creator</a>
      <a href="/creator/login.html">Creator Login</a>
    </div>

    <div class="footer-cta-card">
      <p class="section-kicker">READY TO START?</p>
      <h4>Need a site that looks professional and brings in leads?</h4>
      <a class="button button-primary" href="/quote.html">Start Your Website</a>
    </div>
  `;
})();

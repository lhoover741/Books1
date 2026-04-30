// Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
(function(){
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js?id=G-SJQQ8SQ34Y"]')) {
    const ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-SJQQ8SQ34Y';
    document.head.appendChild(ga);
  }
  gtag('js', new Date());
  gtag('config', 'G-SJQQ8SQ34Y');
})();

document.querySelectorAll('.menu-toggle').forEach(btn=>btn.addEventListener('click',()=>{const nav=document.querySelector('.mobile-nav'); if(nav) nav.classList.toggle('open')}));

document.querySelectorAll('form[action="/api/contact"]').forEach(form=>{form.addEventListener('submit',async e=>{e.preventDefault();const msg=form.querySelector('.form-response')||form.querySelector('.form-status'); if(msg) msg.textContent='Sending...'; try{const res=await fetch('/api/contact',{method:'POST',body:new FormData(form)});const data=await res.json().catch(()=>({})); if(!res.ok||data.ok===false) throw new Error(data.error||'Unable to send.'); if(msg) msg.textContent=data.message||'Thanks. Your message was received.'; form.reset();}catch(err){if(msg) msg.textContent=err.message||'Unable to send right now.'}})});

(() => {
  const css = `.footer.footer-upgraded{margin-top:44px;padding:32px 0 0;border-top:1px solid var(--line);display:grid!important;grid-template-columns:1.4fr 1fr 1fr 1.25fr;gap:28px}.footer-mini{display:block;color:rgba(213,188,159,.78);font-size:.92rem}`;
  if (!document.getElementById('bb-footer-style')) {
    const style = document.createElement('style');
    style.id = 'bb-footer-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  let footer = document.querySelector('.footer');
  const shell = document.querySelector('.site-shell');
  if (!footer && shell) {
    footer = document.createElement('footer');
    footer.className = 'footer container';
    shell.appendChild(footer);
  }
  if (!footer) return;

  const year = new Date().getFullYear();

  footer.className = 'footer container footer-upgraded';
  footer.innerHTML = `
    <div>
      <a class="brand footer-brand" href="/index.html"><span class="brand-mark">☕</span><span class="brand-text"><strong>BOOKS AND</strong><em>BREWS</em></span></a>
      <p>Smart websites. Smooth experience.</p>
      <span class="footer-mini">Custom websites for service businesses and creators.</span>
    </div>
    <div>
      <h4>Services</h4>
      <a href="/services.html">Services</a>
      <a href="/portfolio.html">Portfolio</a>
      <a href="/quote.html">Quote</a>
      <a href="/contact.html">Contact</a>
    </div>
    <div>
      <h4>Creators</h4>
      <a href="/creator.html">Apply</a>
      <a href="/creator/login.html">Login</a>
    </div>
    <div>
      <h4>Start</h4>
      <a class="button button-primary" href="/quote.html">Start Your Website</a>
    </div>
    <div style="grid-column:1/-1;text-align:center;margin-top:20px;padding-top:20px;border-top:1px solid var(--line);">
      <p style="color:var(--muted);font-size:.9rem;margin-bottom:6px;">© ${year} Books and Brews. All rights reserved.</p>
      <p style="font-size:.85rem;">
        <a href="/privacy.html" style="color:var(--muted);margin:0 8px;">Privacy Policy</a> |
        <a href="/terms.html" style="color:var(--muted);margin:0 8px;">Terms of Service</a>
      </p>
    </div>
  `;
})();
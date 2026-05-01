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

document.querySelectorAll('.menu-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const nav = document.querySelector('.mobile-nav');
    if (nav) nav.classList.toggle('open');
  });
});

document.querySelectorAll('form[action="/api/contact"]').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    let msg = form.querySelector('.form-response') || form.querySelector('.form-status');
    if (!msg) {
      msg = document.createElement('p');
      msg.className = 'form-response';
      msg.setAttribute('aria-live', 'polite');
      msg.style.marginTop = '16px';
      msg.style.color = 'var(--accent)';
      msg.style.fontWeight = '800';
      form.appendChild(msg);
    }
    msg.textContent = 'Sending...';

    try {
      const res = await fetch('/api/contact', { method: 'POST', body: new FormData(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Unable to send.');
      msg.textContent = data.message || 'Thanks. Your request was received.';
      if (typeof gtag === 'function') {
        gtag('event', 'lead_submit', { event_category: 'lead', event_label: form.querySelector('[name="formType"]')?.value || 'form' });
      }
      form.reset();
    } catch (err) {
      msg.textContent = err.message || 'Unable to send right now.';
      msg.style.color = '#ffb4a8';
    }
  });
});

(() => {
  const css = `
    .footer.footer-upgraded{margin-top:48px;padding:34px 0 0;border-top:1px solid var(--line);display:grid!important;grid-template-columns:1.4fr 1fr 1fr 1.25fr;gap:28px;align-items:start}
    .footer.footer-upgraded a{display:block;margin:7px 0;color:var(--muted);text-decoration:none;line-height:1.45}
    .footer.footer-upgraded a:hover{color:var(--accent)}
    .footer.footer-upgraded h4{margin:0 0 10px;color:var(--text)}
    .footer.footer-upgraded p{margin:10px 0;color:var(--muted)}
    .footer-mini{display:block;color:rgba(213,188,159,.78);font-size:.92rem;line-height:1.7;max-width:340px}
    .footer-legal{grid-column:1/-1;text-align:center;margin-top:20px;padding-top:20px;border-top:1px solid var(--line)}
    .footer-legal a{display:inline-block!important;margin:0 8px!important}
    @media(max-width:900px){.footer.footer-upgraded{grid-template-columns:1fr 1fr}.footer-legal{grid-column:1/-1}}
    @media(max-width:640px){.footer.footer-upgraded{grid-template-columns:1fr}}
  `;
  if (!document.getElementById('bb-footer-style')) {
    const style = document.createElement('style');
    style.id = 'bb-footer-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  const shell = document.querySelector('.site-shell');
  if (!shell) return;

  let footer = document.querySelector('.footer');
  if (!footer) {
    footer = document.createElement('footer');
    shell.appendChild(footer);
  }

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
      <a href="/quote.html">Request a Quote</a>
      <a href="/contact.html">Contact</a>
    </div>
    <div>
      <h4>Creators</h4>
      <a href="/creator.html">Apply as a Creator</a>
      <a href="/creator/login.html">Creator Login</a>
    </div>
    <div>
      <h4>Start</h4>
      <a class="button button-primary" href="/quote.html">Start Your Website</a>
    </div>
    <div class="footer-legal">
      <p>© ${year} Books and Brews. All rights reserved.</p>
      <p><a href="/privacy.html">Privacy Policy</a> | <a href="/terms.html">Terms of Service</a></p>
    </div>
  `;
})();

// (trimmed for brevity keep GA + form logic same)

(() => {
  const css = `.footer a{display:block;margin:6px 0;color:var(--muted);text-decoration:none}.footer a:hover{color:var(--accent)} .footer.footer-upgraded{grid-template-columns:1.4fr 1fr 1fr 1.25fr}`;
  if (!document.getElementById('bb-footer-style')) {
    const style = document.createElement('style');
    style.id = 'bb-footer-style';
    style.textContent = css;
    document.head.appendChild(style);
  }
})();
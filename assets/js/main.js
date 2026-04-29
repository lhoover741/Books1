
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
if (navToggle && nav) navToggle.addEventListener('click', () => nav.classList.toggle('open'));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

function showFormMessage(form, message, ok = true) {
  let box = form.querySelector('.form-status');
  if (!box) {
    box = document.createElement('p');
    box.className = 'form-status';
    form.appendChild(box);
  }
  box.textContent = message;
  box.style.color = ok ? '#97AFB0' : '#ffb4a8';
}

document.querySelectorAll('form.lead-form').forEach(form => {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const original = button ? button.textContent : '';
    if (button) { button.disabled = true; button.textContent = 'Sending...'; }
    try {
      const formData = new FormData(form);
      formData.set('sourcePage', window.location.pathname);
      const res = await fetch(form.getAttribute('action') || '/api/contact', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Something went wrong.');
      form.reset();
      showFormMessage(form, data.message || 'Thanks. Your request was received.');
    } catch (error) {
      showFormMessage(form, error.message || 'Unable to send right now. Please email hello@booksnbrew.net.', false);
    } finally {
      if (button) { button.disabled = false; button.textContent = original; }
    }
  });
});

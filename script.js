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

// Inject favicon globally
(function(){
  if(!document.querySelector("link[rel='icon']")){
    const link=document.createElement('link');
    link.rel='icon';
    link.type='image/svg+xml';
    link.href='/favicon.svg';
    document.head.appendChild(link);
  }
})();

document.querySelectorAll('.menu-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const nav = document.querySelector('.mobile-nav');
    if (nav) nav.classList.toggle('open');
  });
});

// rest unchanged
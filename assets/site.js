(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav sólida al hacer scroll
  const nav = document.getElementById('nav');
  const onNav = () => nav.classList.toggle('solid', scrollY > 24);
  addEventListener('scroll', onNav, { passive: true }); onNav();

  // Aparición al entrar en pantalla + contadores
  const countUp = (el) => {
    const end = +el.dataset.count; if (reduce) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (now) => { const p = Math.min(1, (now - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv').forEach(el => { el.querySelectorAll('[data-count]').forEach(c => c.textContent = '0'); io.observe(el); });

  // Parallax
  const layers = [...document.querySelectorAll('[data-speed]')];
  let ticking = false;
  const parallax = () => {
    const vh = innerHeight;
    for (const el of layers) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const delta = (r.top + r.height / 2) - vh / 2;
      el.style.transform = 'translate3d(0,' + (delta * +el.dataset.speed).toFixed(1) + 'px,0)';
    }
    ticking = false;
  };
  if (!reduce) {
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    addEventListener('resize', parallax); parallax();
  }

  // Cronómetro del hero: 0:00 → 3:00
  const clock = document.getElementById('clock');
  if (clock && !reduce) {
    let s = 0;
    setInterval(() => { s = s >= 180 ? 0 : s + 6; clock.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 120);
  } else if (clock) clock.textContent = '3:00';

  // Modal de inicio
  const dlg = document.getElementById('lead');
  const box = document.getElementById('leadbox');
  const form = document.getElementById('leadform');
  const status = document.getElementById('leadstatus');
  const send = document.getElementById('leadsend');
  const setStatus = (m, err) => { status.textContent = m; status.classList.toggle('err', !!err); };
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    setTimeout(() => { const f = form.querySelector('input[name=nombre]'); if (f && !box.classList.contains('sent')) f.focus(); }, 50);
  }));
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  form.addEventListener('input', () => { if (status.classList.contains('err')) setStatus(''); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { setStatus(t('err_req'), true); form.reportValidity(); return; }
    const fd = new FormData(form);
    if (fd.get('website2')) return;
    const data = { idioma: LANG, nombre: fd.get('nombre'), empresa: fd.get('empresa'), email: fd.get('email'), telefono: fd.get('telefono'), origen: location.href };
    send.disabled = true; setStatus(t('st_send'));
    try {
      const r = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(r.status);
      try { localStorage.setItem('lead', JSON.stringify(data)); } catch (_) {}
      const q = new URLSearchParams({ lang: LANG, n: data.nombre, e: data.empresa, m: data.email, t: data.telefono });
      document.getElementById('tofiles').href = '/enviar?' + q.toString();
      box.classList.add('sent');
    } catch (err) {
      console.error(err); setStatus(t('err_send'), true); send.disabled = false;
    }
  });
})();

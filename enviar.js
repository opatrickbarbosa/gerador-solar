(function(){
  const MAX = 20 * 1024 * 1024;
  const form = document.getElementById('form');
  const statusEl = document.getElementById('status');
  const submitBtn = document.getElementById('submit');
  const setStatus = (msg, err) => { statusEl.textContent = msg; statusEl.classList.toggle('err', !!err); };
  const slug = s => (s || 'empresa').toString().normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) || 'empresa';

  // Prefill: enlace personalizado (?n=&e=&m=&t=) o datos del formulario corto
  const q = new URLSearchParams(location.search);
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('lead') || '{}'); } catch (_) {}
  const pre = { nombre: q.get('n') || saved.nombre, empresa: q.get('e') || saved.empresa, email: q.get('m') || saved.email, telefono: q.get('t') || saved.telefono, web: q.get('w') };
  for (const [k, v] of Object.entries(pre)) if (v && form[k]) form[k].value = v;

  form.addEventListener('input', () => { if (statusEl.classList.contains('err')) setStatus(''); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { setStatus(t('err_req_f'), true); form.reportValidity(); return; }
    const fd = new FormData(form);
    if (fd.get('website2')) return;

    const groups = [['propuesta', form.propuesta.files], ['calculo', form.calculo.files], ['logo', form.logo.files], ['otros', form.otros.files]];
    const files = [];
    for (const [kind, list] of groups) for (const f of list) {
      if (f.size > MAX) { setStatus(t('err_size', { f: f.name }), true); return; }
      files.push({ kind, file: f });
    }

    submitBtn.disabled = true;
    try {
      const { upload } = await import('https://esm.sh/@vercel/blob@1/client');
      const folder = 'solicitudes/' + new Date().toISOString().slice(0,10) + '-' + slug(fd.get('empresa'));
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        setStatus(t('st_up', { n: i + 1, t: files.length }));
        const { kind, file } = files[i];
        const blob = await upload(folder + '/' + kind + '-' + file.name, file, { access: 'public', handleUploadUrl: '/api/upload', multipart: file.size > 5 * 1024 * 1024 });
        uploaded.push({ kind, name: file.name, size: file.size, url: blob.url });
      }
      setStatus(t('st_send'));
      const payload = {
        idioma: LANG,
        empresa: fd.get('empresa'), nombre: fd.get('nombre'), email: fd.get('email'), telefono: fd.get('telefono'),
        web: fd.get('web'), ciudad: fd.get('ciudad'), comerciales: fd.get('comerciales'), volumen: fd.get('volumen'),
        herramienta: fd.get('herramienta'), clientes: fd.getAll('clientes'), incluye: fd.getAll('incluye'),
        mensaje: fd.get('mensaje'), archivos: uploaded
      };
      const r = await fetch('/api/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('send ' + r.status);
      document.getElementById('formbox').classList.add('sent');
      scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setStatus(t('err_send'), true);
      submitBtn.disabled = false;
    }
  });
})();

// Formulario corto (4 datos): te avisa por email con WhatsApp directo y el enlace personalizado para que envíe sus archivos.
// Variables de entorno: RESEND_API_KEY, DESTINO_EMAIL, REMITENTE (opcional), SITE_URL (opcional, ej. https://kilovia.es)

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const d = req.body || {};
  if (['nombre', 'empresa', 'email', 'telefono'].some((k) => !String(d[k] || '').trim())) return res.status(400).json({ error: 'Faltan campos' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return res.status(400).json({ error: 'Email no válido' });

  const site = process.env.SITE_URL || `https://${req.headers.host}`;
  const lang = ['es', 'ca', 'pt'].includes(d.idioma) ? d.idioma : 'es';
  const link = `${site}/enviar?` + new URLSearchParams({ lang, n: d.nombre, e: d.empresa, m: d.email, t: d.telefono }).toString();
  const wa = String(d.telefono).replace(/[^\d]/g, '');

  const html = `
  <div style="font-family:Arial,sans-serif;font-size:15px;color:#0B1B2B">
    <h2 style="margin:0 0 12px">Nuevo contacto: ${esc(d.empresa)}</h2>
    <p><strong>${esc(d.nombre)}</strong> · ${esc(d.email)} · ${esc(d.telefono)} · idioma: ${esc(lang)}</p>
    ${wa ? `<p><a href="https://wa.me/${wa}">Escribir por WhatsApp</a></p>` : ''}
    <p>Enlace personalizado para que envíe su propuesta y su Excel:<br><a href="${esc(link)}">${esc(link)}</a></p>
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.REMITENTE || 'Kilovia <onboarding@resend.dev>',
      to: [process.env.DESTINO_EMAIL],
      reply_to: d.email,
      subject: `Nuevo contacto: ${String(d.empresa).slice(0, 80)}`,
      html,
    }),
  });
  if (!r.ok) { console.error('Resend', r.status, await r.text()); return res.status(502).json({ error: 'No se pudo enviar' }); }
  return res.status(200).json({ ok: true });
}

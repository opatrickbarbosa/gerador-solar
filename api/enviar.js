// Recibe los datos del formulario y te envía un email (vía Resend) con los archivos adjuntos y sus enlaces.
// Variables de entorno: RESEND_API_KEY, DESTINO_EMAIL, REMITENTE (opcional).

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isBlobUrl = (u) => { try { const h = new URL(u).hostname; return h.endsWith('.public.blob.vercel-storage.com'); } catch { return false; } };
const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const d = req.body || {};
  const required = ['empresa', 'nombre', 'email', 'telefono'];
  if (required.some((k) => !String(d[k] || '').trim())) return res.status(400).json({ error: 'Faltan campos' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return res.status(400).json({ error: 'Email no válido' });

  const archivos = (Array.isArray(d.archivos) ? d.archivos : []).filter((a) => a && isBlobUrl(a.url)).slice(0, 15);
  if (!archivos.some((a) => a.kind === 'propuesta')) return res.status(400).json({ error: 'Falta la propuesta' });

  const filas = [
    ['Idioma', d.idioma], ['Empresa', d.empresa], ['Nombre', d.nombre], ['Email', d.email], ['Teléfono', d.telefono],
    ['Web', d.web], ['Ciudad / zona', d.ciudad], ['Comerciales', d.comerciales], ['Propuestas al mes', d.volumen],
    ['Calculan con', d.herramienta], ['Clientes', (d.clientes || []).join(', ')], ['Incluyen', (d.incluye || []).join(', ')],
  ].filter(([, v]) => v);

  const wa = String(d.telefono).replace(/[^\d]/g, '');
  const html = `
  <div style="font-family:Arial,sans-serif;font-size:15px;color:#0E1A14">
    <h2 style="margin:0 0 12px">Nueva solicitud: ${esc(d.empresa)}</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${filas.map(([k, v]) => `<tr><td style="color:#5A6B61">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join('')}
    </table>
    ${d.mensaje ? `<p style="margin-top:16px"><strong>Mensaje:</strong><br>${esc(d.mensaje).replace(/\n/g, '<br>')}</p>` : ''}
    <h3 style="margin-top:20px">Archivos</h3>
    <ul>${archivos.map((a) => `<li>${esc(a.kind)}: <a href="${esc(a.url)}">${esc(a.name)}</a> (${kb(a.size || 0)})</li>`).join('')}</ul>
    ${wa ? `<p><a href="https://wa.me/${wa}">Responder por WhatsApp</a></p>` : ''}
  </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.REMITENTE || 'Generador de propuestas <onboarding@resend.dev>',
      to: [process.env.DESTINO_EMAIL],
      reply_to: d.email,
      subject: `Nueva propuesta recibida: ${String(d.empresa).slice(0, 80)}`,
      html,
      attachments: archivos.map((a) => ({ filename: `${a.kind}-${a.name}`, path: a.url })),
    }),
  });

  if (!r.ok) {
    console.error('Resend', r.status, await r.text());
    return res.status(502).json({ error: 'No se pudo enviar' });
  }
  return res.status(200).json({ ok: true });
}

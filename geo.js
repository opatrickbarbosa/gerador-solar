// Devuelve el país y la región del visitante a partir de las cabeceras de geolocalización de Vercel.
// Ej.: Barcelona -> { country: "ES", region: "CT" }
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    country: req.headers['x-vercel-ip-country'] || null,
    region: req.headers['x-vercel-ip-country-region'] || null,
  });
}

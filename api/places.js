export default async function handler(req, res) {
  const { q } = req.query;
  if (!q || q.length < 3) return res.json({ predictions: [] });

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&components=country:mx&types=address&language=es&key=${process.env.GOOGLE_MAPS_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json({ predictions: (data.predictions || []).map(p => ({ description: p.description })) });
  } catch (e) {
    res.json({ predictions: [] });
  }
}

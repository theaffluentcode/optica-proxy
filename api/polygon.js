export default async function handler(req, res) {
  // Allow requests from any origin (required for browser access)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // Build the Polygon URL from the incoming path + query params
  const { path, ...params } = req.query;
  if (!path) return res.status(400).json({ error: "Missing path" });

  const polygonPath = Array.isArray(path) ? path.join("/") : path;
  const url = new URL(`https://api.polygon.io/${polygonPath}`);

  // Attach all query params (ticker, date filters, limit, etc.)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  // Inject the Polygon API key from Vercel environment variable
  url.searchParams.set("apiKey", process.env.POLYGON_API_KEY);

  try {
    const upstream = await fetch(url.toString());
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream fetch failed", detail: e.message });
  }
}

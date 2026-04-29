export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key, anthropic-version");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Route Anthropic AI calls
  if (req.query.service === "anthropic") {
    try {
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(req.body),
      });
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  // Route Polygon calls
  const { path, ...params } = req.query;
  if (!path) return res.status(400).json({ error: "Missing path" });

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "POLYGON_API_KEY not set" });

  const polygonPath = Array.isArray(path) ? path.join("/") : path;
  const url = new URL(`https://api.polygon.io/${polygonPath}`);
  url.searchParams.set("apiKey", apiKey);
  Object.entries(params).forEach(([k, v]) => {
    if (k !== "service") url.searchParams.set(k, v);
  });

  try {
    const upstream = await fetch(url.toString());
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}


export async function POST(req: Request) {
  try {
    const payload = await req.json();
    if (!process.env.API_BASE) {
      return new Response(JSON.stringify({ error: "API_BASE not configured" }), { status: 500 });
    }
    const r = await fetch(`${process.env.API_BASE}/send-email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") || "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "proxy failed" }), { status: 500 });
  }
}

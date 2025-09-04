export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const base = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;
    if (!base) {
      return new Response(
        JSON.stringify({ error: "API_BASE not configured" }),
        { status: 500 }
      );
    }
    const r = await fetch(`${base}/ask`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: {
        "content-type": r.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "proxy failed" }),
      { status: 500 }
    );
  }
}

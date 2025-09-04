
# MCP CV Playground (minimal Next.js)

A tiny UI to:
- Ask questions about your CV (proxies to `/ask` on your backend)
- Send a test email (proxies to `/send-email` on your backend)

This avoids CORS/Mixed-Content by using **Next.js API routes** as a proxy.

## Setup

1) Set the backend base URL (your MCP CV server) in `.env.local`:
```
API_BASE=http://localhost:8080
```
For production (Vercel), set `API_BASE` in the project Environment Variables to your deployed backend, e.g.:
```
API_BASE=https://your-backend.onrender.com
```

2) Install & run:
```
npm install
npm run dev
# open http://localhost:3000
```

## How it works

- Frontend fetches `/api/ask` and `/api/send-email` on the same origin.
- These API routes forward the requests to your backend using `API_BASE`. No browser CORS required.

## Notes

- This project intentionally has **no Tailwind or UI libs**—kept simple and human-readable.
- If you prefer to call the MCP endpoint (`/mcp`) directly, you can add another API route that posts the JSON-RPC `initialize` and `tools/call` payloads and returns the raw response.

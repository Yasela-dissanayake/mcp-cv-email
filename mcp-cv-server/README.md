# MCP CV Server (minimal)

- Answers CV questions from `resume.json`
- Sends email via HTTP and MCP tool (`send_email`)
- MCP over WebSocket at `/mcp`
- HTTP helpers:
  - `POST /ask` -> { question } => { answer }
  - `POST /send-email` -> { to, subject, body }

## Quick start

```bash
pnpm i   # or npm i / yarn
cp .env.example .env   # customize if you have SMTP
pnpm dev
# open: http://localhost:8080/health
```

// src/server.ts
import "dotenv/config";
import express from "express";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";

// Add type annotations for Express
import type { Request, Response } from "express";
import { z } from "zod";

// MCP v1.x imports
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

// ------------------------------
// Types & tiny resume helpers
// ------------------------------
type WorkItem = {
  title: string;
  company: string;
  location?: string;
  start?: string; // YYYY-MM
  end?: string; // YYYY-MM | "Present" | "Scheduled"
  summary?: string;
};

type Resume = {
  basics?: { name?: string; email?: string; website?: string };
  work?: WorkItem[];
  skills?: string[];
};

function loadResume(): Resume {
  const p = path.resolve(process.cwd(), "resume.json");
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as Resume;
}

function pickLastRole(resume: Resume): WorkItem | undefined {
  const work = resume.work ?? [];
  if (work.length === 0) return undefined;

  const score = (w: WorkItem) => {
    const e = (w.end || "").toLowerCase();
    if (e === "present") return 9_999_999_9;
    if (e === "scheduled") return 9_999_999_8;
    const s = (w.end || w.start || "").replace("-", "");
    const n = Number(s || 0);
    return Number.isNaN(n) ? 0 : n;
  };
  return [...work].sort((a, b) => score(b) - score(a))[0];
}

function answerCvQuestion(resume: Resume, q: string): string {
  const question = q.toLowerCase().trim();
  const last = pickLastRole(resume);

  // Q1
  if (/(what|which).*(role|title).*last (position|job|role)/.test(question)) {
    if (!last) return "I couldn't find any work entries.";
    const endLabel = last.end ? ` (${last.end})` : "";
    return `Your last role: ${last.title} at ${last.company}${endLabel}.`;
  }

  // Q2
  if (/companies|where.*worked|worked at which companies/.test(question)) {
    const companies = (resume.work ?? []).map((w) => w.company).filter(Boolean);
    return companies.length
      ? `Companies: ${companies.join(", ")}.`
      : "No companies found.";
  }

  // Q3
  const mCompany = question.match(/work(ed)? at ([a-z0-9 .&-]+)/i);
  if (mCompany) {
    const c = mCompany[2].trim().toLowerCase();
    const hit = (resume.work ?? []).find(
      (w) => (w.company || "").toLowerCase() === c
    );
    if (hit) {
      return `At ${hit.company}: ${hit.title} — ${hit.start || "?"} to ${
        hit.end || "?"
      }.`;
    }
  }

  return [
    "I can answer:",
    "• What role did I have at my last position?",
    "• Which companies have I worked at?",
    "• When did I work at <company>?",
    "Update resume.json to improve answers.",
  ].join("\n");
}

// ------------------------------
// Email (Nodemailer) — minimal
// ------------------------------
type SendEmailArgs = { to: string; subject: string; body: string };

async function makeTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const test = await nodemailer.createTestAccount();
    return {
      transporter: nodemailer.createTransport({
        host: test.smtp.host,
        port: test.smtp.port,
        secure: test.smtp.secure,
        auth: { user: test.user, pass: test.pass },
      }),
      from: `Demo Sender <${test.user}>`,
      isTest: true,
    };
  }

  return {
    transporter: nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    }),
    from: process.env.SMTP_FROM || process.env.SMTP_USER!,
    isTest: false,
  };
}

async function sendEmail({ to, subject, body }: SendEmailArgs) {
  const { transporter, from, isTest } = await makeTransport();
  const info = await transporter.sendMail({ from, to, subject, text: body });
  const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
  return { messageId: info.messageId, previewUrl, isTest };
}

// ------------------------------
// Express app + HTTP routes
// ------------------------------
const app = express();
app.use(express.json());

const resume = loadResume();

app.get("/", (_req, res) => {
  res
    .type("text/plain")
    .send(
      "MCP CV Server: /health, POST /ask, POST /send-email, HTTP MCP at /mcp"
    );
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/ask", (req, res) => {
  const q = String(req.body?.question || "");
  const ans = answerCvQuestion(resume, q);
  res.json({ question: q, answer: ans });
});

app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, body } = req.body || {};
    if (!to || !subject || !body) {
      return res.status(400).json({ error: "to, subject, body are required" });
    }
    const result = await sendEmail({ to, subject, body });
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "send failed" });
  }
});

const server = http.createServer(app);
const port = Number(process.env.PORT || 8080);
server.listen(port, () => {
  console.log(`HTTP listening on :${port}`);
});

// ------------------------------
// MCP v1.x: tools over HTTP
// ------------------------------
const mcpServer = new McpServer({ name: "cv-mcp", version: "0.1.0" });

// Tool: ask_cv
mcpServer.tool("ask_cv", { question: z.string() }, async ({ question }) => {
  const ans = answerCvQuestion(resume, question);
  return { content: [{ type: "text", text: ans }] };
});

// Tool: send_email
mcpServer.tool(
  "send_email",
  { to: z.string().email(), subject: z.string(), body: z.string() },
  async ({ to, subject, body }) => {
    const result = await sendEmail({ to, subject, body });
    let text = `Queued email: ${result.messageId}`;
    if (result.isTest && result.previewUrl)
      text += `\nPreview (Ethereal): ${result.previewUrl}`;
    return { content: [{ type: "text", text }] };
  }
);

// Streamable HTTP transport on /mcp
type SessionMap = Record<string, StreamableHTTPServerTransport>;
const sessions: SessionMap = {};

app.all("/mcp", async (req, res) => {
  const sid = req.headers["mcp-session-id"] as string | undefined;
  let transport = sid ? sessions[sid] : undefined;

  // New session starts with an "initialize" request
  if (!transport && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newId) => {
        sessions[newId] = transport!;
      },
    });
    transport.onclose = () => {
      if (transport?.sessionId) delete sessions[transport.sessionId];
    };
    await mcpServer.connect(transport);
  }

  if (!transport) {
    res
      .status(400)
      .json({ error: "No MCP session. Send initialize request first." });
    return;
  }

  await transport.handleRequest(req, res);
});

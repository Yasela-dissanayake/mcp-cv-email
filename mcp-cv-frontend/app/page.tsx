
"use client";

import { useState } from "react";

export default function Home() {
  // Show base API for debug (not required)
  const [apiBase, setApiBase] = useState<string>(process.env.NEXT_PUBLIC_API_BASE || "");

  // CV Q&A
  const [question, setQuestion] = useState("What role did I have at my last position?");
  const [answer, setAnswer] = useState<string>("");
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [errorAsk, setErrorAsk] = useState<string>("");

  // Email
  const [to, setTo] = useState("someone@example.com");
  const [subject, setSubject] = useState("Hello from MCP demo");
  const [body, setBody] = useState("This is a test email.");
  const [emailResult, setEmailResult] = useState<string>("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [errorEmail, setErrorEmail] = useState<string>("");

  async function askCv() {
    setLoadingAsk(true);
    setErrorAsk("");
    setAnswer("");
    try {
      const res = await fetch(`/api/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnswer(data.answer ?? "(no answer)");
    } catch (e: any) {
      setErrorAsk(e?.message || "Failed to ask");
    } finally {
      setLoadingAsk(false);
    }
  }

  async function sendEmail() {
    setLoadingEmail(true);
    setErrorEmail("");
    setEmailResult("");
    try {
      const res = await fetch(`/api/send-email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${res.status}`);
      let msg = `Queued messageId: ${data.messageId}`;
      if (data.previewUrl) msg += `\nPreview: ${data.previewUrl}`;
      setEmailResult(msg);
    } catch (e: any) {
      setErrorEmail(e?.message || "Failed to send");
    } finally {
      setLoadingEmail(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>MCP CV Playground (minimal)</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        This UI proxies to your backend via Next.js API routes to avoid CORS issues.
      </p>

      {/* CV Ask */}
      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Ask about my CV</h2>
        <label style={{ display: "block", fontSize: 14, color: "#333", marginBottom: 6 }}>Question</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What role did I have at my last position?"
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12 }}
        />
        <button
          onClick={askCv}
          disabled={loadingAsk}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            background: loadingAsk ? "#f0f0f0" : "white",
            cursor: loadingAsk ? "default" : "pointer"
          }}
        >
          {loadingAsk ? "Asking..." : "Ask"}
        </button>

        {errorAsk && (
          <pre style={{ whiteSpace: "pre-wrap", color: "#b00020", marginTop: 12 }}>{errorAsk}</pre>
        )}
        {answer && (
          <>
            <h3 style={{ fontSize: 16, marginTop: 16 }}>Answer</h3>
            <pre style={{ whiteSpace: "pre-wrap", background: "#fafafa", padding: 12, borderRadius: 8 }}>
              {answer}
            </pre>
          </>
        )}
      </section>

      {/* Send Email */}
      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Send test email</h2>

        <label style={{ display: "block", fontSize: 14, color: "#333", marginBottom: 6 }}>To</label>
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="someone@example.com"
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12 }}
        />

        <label style={{ display: "block", fontSize: 14, color: "#333", marginBottom: 6 }}>Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12 }}
        />

        <label style={{ display: "block", fontSize: 14, color: "#333", marginBottom: 6 }}>Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12, fontFamily: "inherit" }}
        />

        <button
          onClick={sendEmail}
          disabled={loadingEmail}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            background: loadingEmail ? "#f0f0f0" : "white",
            cursor: loadingEmail ? "default" : "pointer"
          }}
        >
          {loadingEmail ? "Sending..." : "Send email"}
        </button>

        {errorEmail && (
          <pre style={{ whiteSpace: "pre-wrap", color: "#b00020", marginTop: 12 }}>{errorEmail}</pre>
        )}
        {emailResult && (
          <>
            <h3 style={{ fontSize: 16, marginTop: 16 }}>Result</h3>
            <pre style={{ whiteSpace: "pre-wrap", background: "#fafafa", padding: 12, borderRadius: 8 }}>
              {emailResult}
            </pre>
          </>
        )}
      </section>
    </main>
  );
}

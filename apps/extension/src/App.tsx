/// <reference types="chrome" />
import { useEffect, useState } from "react"
import { registerSite, getSiteStatus, askQuestion, submitEmail } from "./api"

type Message = { role: "bot" | "user"; text: string }
type State = "idle" | "registering" | "processing" | "ready" | "failed"

const STATUS_LABEL: Record<string, string> = {
  pending: "Starting up…", crawling: "Crawling page…",
  translating: "Translating…", indexing: "Building index…",
  ready: "Ready", failed: "Failed"
}

export default function App() {
  const [url, setUrl] = useState("")
  const [siteId, setSiteId] = useState<string | null>(null)
  const [state, setState] = useState<State>("idle")
  const [status, setStatus] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [needsEmail, setNeedsEmail] = useState(false)
  const [email, setEmail] = useState("")
  const [lastQ, setLastQ] = useState("")
  const [lastLang, setLastLang] = useState("en")

  useEffect(() => {
    // Get current tab URL
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const tabUrl = tabs[0]?.url ?? ""
      if (tabUrl) {
        setUrl(tabUrl)
        // Check storage for existing siteId
        chrome.storage?.local.get([tabUrl], (result) => {
          if (result[tabUrl]) {
            setSiteId(result[tabUrl])
            setState("ready")
            setMessages([{ role: "bot", text: "I know this page! Ask me anything." }])
          }
        })
      }
    })
  }, [])

  async function handleRegister() {
    setState("registering")
    try {
      const data = await registerSite(url, ["fr", "es"])
      setSiteId(data.siteId)
      setState("processing")
      setStatus("pending")
      pollStatus(data.siteId)
    } catch {
      setState("failed")
    }
  }

  function pollStatus(id: string) {
    const iv = setInterval(async () => {
      const data = await getSiteStatus(id)
      setStatus(data.status)
      if (data.status === "ready") {
        clearInterval(iv)
        setState("ready")
        chrome.storage?.local.set({ [url]: id })
        setMessages([{ role: "bot", text: "Done! I've indexed this page. Ask me anything." }])
      }
      if (data.status === "failed") {
        clearInterval(iv)
        setState("failed")
      }
    }, 2500)
  }

  async function send() {
    if (!input.trim() || !siteId) return
    const q = input.trim()
    setInput("")
    setLastQ(q)
    setNeedsEmail(false)
    setMessages(p => [...p, { role: "user", text: q }])
    setLoading(true)

    try {
      const res = await askQuestion(siteId, q)
      if (res.needsEmail) {
        setMessages(p => [...p, { role: "bot", text: "I couldn't find an answer to that." }])
        setNeedsEmail(true)
      } else {
        setLastLang(res.language ?? "en")
        setMessages(p => [...p, { role: "bot", text: res.answer }])
      }
    } catch {
      setMessages(p => [...p, { role: "bot", text: "Something went wrong." }])
    } finally { setLoading(false) }
  }

  async function handleEmail() {
    if (!email.trim() || !siteId) return
    await submitEmail(siteId, lastQ, email, lastLang)
    setNeedsEmail(false)
    setEmail("")
    setMessages(p => [...p, { role: "bot", text: "Got it! We'll follow up with you." }])
  }

  const progress = { pending: 10, crawling: 30, translating: 60, indexing: 85, ready: 100 }[status] ?? 10

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "540px" }}>
      {/* Header */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 10.7a1.4 1.4 0 0 1-1.4 1.4H4.7L2 14.7V3.4A1.4 1.4 0 0 1 3.4 2h9.2A1.4 1.4 0 0 1 14 3.4z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Blaze</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</div>
        </div>
      </div>

      {/* Idle — register prompt */}
      {state === "idle" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Index this page</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4, lineHeight: 1.6 }}>Blaze will crawl, translate and index this page so you can ask questions about it.</p>
          </div>
          <button
            onClick={handleRegister}
            style={{ background: "rgba(255,255,255,0.92)", color: "#18181b", border: "none", borderRadius: 12, padding: "11px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" }}
          >
            Index this page →
          </button>
        </div>
      )}

      {/* Processing */}
      {state === "processing" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1.5s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{STATUS_LABEL[status] ?? "Processing…"}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>This takes about 30 seconds</p>
          </div>
          <div style={{ width: "100%" }}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "rgba(255,255,255,0.7)", borderRadius: 99, width: `${progress}%`, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {["pending","crawling","translating","indexing","ready"].map(s => (
                <span key={s} style={{ fontSize: 10, color: status === s ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)", textTransform: "capitalize" }}>{s}</span>
              ))}
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Failed */}
      {state === "failed" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 12, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#f87171" }}>Failed to index this page.</p>
          <button onClick={() => setState("idle")} style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Try again</button>
        </div>
      )}

      {/* Ready — chat */}
      {state === "ready" && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", fontSize: 13, lineHeight: 1.6, padding: "10px 14px",
                  borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                  background: m.role === "user" ? "#ffffff" : "rgba(255,255,255,0.07)",
                  color: m.role === "user" ? "#18181b" : "rgba(255,255,255,0.85)",
                  border: m.role === "bot" ? "1px solid rgba(255,255,255,0.08)" : "none",
                  fontWeight: m.role === "user" ? 500 : 400
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 5, padding: "10px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px 14px 14px 3px", width: "fit-content" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: `bounce 1.2s ${i*0.15}s ease-in-out infinite` }} />
                ))}
              </div>
            )}
          </div>

          {/* Email capture */}
          {needsEmail && (
            <div style={{ margin: "0 14px 10px", padding: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>No answer found. Leave your email and we'll follow up.</p>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 13px", fontSize: 13, color: "#fff", outline: "none", fontFamily: "inherit" }} />
              <button onClick={handleEmail}
                style={{ background: "rgba(255,255,255,0.92)", color: "#18181b", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Send →
              </button>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask a question…"
              style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px 14px", fontSize: 13, color: "#fff", outline: "none", fontFamily: "inherit" }} />
            <button onClick={send}
              style={{ background: "rgba(255,255,255,0.92)", color: "#18181b", border: "none", borderRadius: 11, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2L7 9M14 2L9.5 14 7 9 2 6.5z"/>
              </svg>
            </button>
          </div>
          <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }`}</style>
        </>
      )}

      {/* Footer */}
      <div style={{ padding: "6px 0 10px", textAlign: "center", borderTop: state === "ready" ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.03em" }}>Powered by Blaze</span>
      </div>
    </div>
  )
}
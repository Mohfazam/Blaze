"use client"

import { useState, useEffect } from "react"

const API = "http://localhost:4000"

type Site = { siteId: string; status: string; url: string }
type Query = { id: string; question: string; email: string | null; language: string | null; createdAt: string; siteId: string }

const STATUS_STYLES: Record<string, string> = {
  pending:     "bg-amber-50 text-amber-700 border border-amber-200",
  crawling:    "bg-blue-50 text-blue-700 border border-blue-200",
  translating: "bg-violet-50 text-violet-700 border border-violet-200",
  indexing:    "bg-indigo-50 text-indigo-700 border border-indigo-200",
  ready:       "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed:      "bg-red-50 text-red-600 border border-red-200",
}

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400", crawling: "bg-blue-400",
  translating: "bg-violet-400", indexing: "bg-indigo-400",
  ready: "bg-emerald-500", failed: "bg-red-400",
}

export default function Dashboard() {
  const [sites, setSites] = useState<Site[]>([])
  const [queries, setQueries] = useState<Query[]>([])
  const [selected, setSelected] = useState<Site | null>(null)
  const [tab, setTab] = useState<"sites" | "queries">("sites")
  const [url, setUrl] = useState("")
  const [langs, setLangs] = useState("fr, es")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchQueries() }, [])

  async function fetchQueries() {
    try {
      const res = await fetch(`${API}/queries`)
      if (res.ok) setQueries(await res.json())
    } catch {}
  }

  async function register() {
    setError("")
    if (!url.trim()) return setError("URL is required")
    const languages = langs.split(",").map(l => l.trim()).filter(Boolean)
    setLoading(true)
    try {
      const res = await fetch(`${API}/sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), languages })
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error ?? "Failed")
      const site: Site = { siteId: data.siteId, status: "pending", url: url.trim() }
      setSites(p => [site, ...p])
      setSelected(site)
      setUrl("")
      setTab("sites")
      poll(data.siteId)
    } catch { setError("Network error") }
    finally { setLoading(false) }
  }

  function poll(siteId: string) {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`${API}/sites/${siteId}`)
        const data = await res.json()
        setSites(p => p.map(s => s.siteId === siteId ? { ...s, status: data.status } : s))
        setSelected(p => p?.siteId === siteId ? { ...p, status: data.status } : p)
        if (data.status === "ready" || data.status === "failed") clearInterval(iv)
      } catch { clearInterval(iv) }
    }, 2500)
  }

  function copySnippet() {
    const snippet = `<script src="http://localhost:5173/dist/widget.iife.js" data-site-id="${selected?.siteId}"></script>`
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-stone-200 px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-stone-900 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 10.7a1.4 1.4 0 0 1-1.4 1.4H4.7L2 14.7V3.4A1.4 1.4 0 0 1 3.4 2h9.2A1.4 1.4 0 0 1 14 3.4z"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-stone-900 tracking-tight">Blaze</span>
        </div>
        <span className="text-xs text-stone-400">Owner Dashboard</span>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10 flex gap-8">

        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col gap-4">

          {/* Register Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-stone-900 mb-0.5">Add a website</h2>
            <p className="text-xs text-stone-400 mb-4">Register your site to start indexing and translating content.</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-1.5">Website URL</label>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && register()}
                  placeholder="https://yoursite.com"
                  className="w-full text-sm border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-900 placeholder-stone-300 outline-none focus:border-stone-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-1.5">
                  Languages <span className="text-stone-300 font-normal">comma separated</span>
                </label>
                <input
                  value={langs}
                  onChange={e => setLangs(e.target.value)}
                  placeholder="fr, es, de"
                  className="w-full text-sm border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-900 placeholder-stone-300 outline-none focus:border-stone-400 transition-colors"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                onClick={register}
                disabled={loading}
                className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
              >
                {loading ? "Registering…" : "Register site →"}
              </button>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="bg-white rounded-2xl border border-stone-200 p-1.5 flex gap-1">
            {(["sites", "queries"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-xs font-medium py-2 rounded-xl transition-colors capitalize ${
                  tab === t ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {t === "sites" ? "My Sites" : `Queries ${queries.length > 0 ? `(${queries.length})` : ""}`}
              </button>
            ))}
          </div>

          {/* Sites list */}
          {tab === "sites" && (
            <div className="flex flex-col gap-2">
              {sites.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-6">No sites yet</p>
              )}
              {sites.map(site => (
                <button
                  key={site.siteId}
                  onClick={() => setSelected(site)}
                  className={`w-full text-left bg-white border rounded-xl p-3.5 transition-colors ${
                    selected?.siteId === site.siteId
                      ? "border-stone-400 shadow-sm"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <p className="text-xs font-medium text-stone-800 truncate">{site.url}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[site.status] ?? "bg-stone-400"}`} />
                    <span className="text-xs text-stone-400 capitalize">{site.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Queries list */}
          {tab === "queries" && (
            <div className="flex flex-col gap-2">
              {queries.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-6">No unanswered queries yet</p>
              )}
              {queries.map(q => (
                <div key={q.id} className="bg-white border border-stone-200 rounded-xl p-3.5">
                  <p className="text-xs text-stone-700 font-medium line-clamp-2">{q.question}</p>
                  {q.email && (
                    <p className="text-xs text-stone-400 mt-1">{q.email}</p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    {q.language && (
                      <span className="text-xs text-stone-300 uppercase">{q.language}</span>
                    )}
                    <span className="text-xs text-stone-300">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main panel */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-32">
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-stone-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 10.7a1.4 1.4 0 0 1-1.4 1.4H4.7L2 14.7V3.4A1.4 1.4 0 0 1 3.4 2h9.2A1.4 1.4 0 0 1 14 3.4z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-stone-500">No site selected</p>
              <p className="text-xs text-stone-300 mt-1">Register a site or select one from the list</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Site header */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-stone-400 mb-1">Registered site</p>
                    <h1 className="text-base font-semibold text-stone-900 truncate">{selected.url}</h1>
                    <p className="text-xs text-stone-400 mt-1 font-mono">{selected.siteId}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[selected.status] ?? "bg-stone-100 text-stone-500"}`}>
                    {selected.status}
                  </span>
                </div>

                {/* Progress bar for active states */}
                {!["ready", "failed"].includes(selected.status) && (
                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-stone-400 mb-2">
                      <span>Processing…</span>
                      <span className="capitalize">{selected.status}</span>
                    </div>
                    <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-900 rounded-full animate-pulse" style={{
                        width: selected.status === "crawling" ? "25%" :
                               selected.status === "translating" ? "55%" :
                               selected.status === "indexing" ? "80%" : "10%"
                      }} />
                    </div>
                    <div className="flex justify-between text-xs text-stone-300 mt-2">
                      {["pending", "crawling", "translating", "indexing", "ready"].map(s => (
                        <span key={s} className={`capitalize ${selected.status === s ? "text-stone-600 font-medium" : ""}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.status === "ready" && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 8 6 13 15 3"/>
                    </svg>
                    Site is indexed and ready to answer questions
                  </div>
                )}

                {selected.status === "failed" && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-red-500">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="8" r="7"/><line x1="8" y1="5" x2="8" y2="8"/><line x1="8" y1="11" x2="8" y2="11"/>
                    </svg>
                    Processing failed. Check your API and try again.
                  </div>
                )}
              </div>

              {/* Embed snippet */}
              {selected.status === "ready" && (
                <div className="bg-white border border-stone-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-stone-900">Embed snippet</h2>
                      <p className="text-xs text-stone-400 mt-0.5">Paste this before the closing body tag of your site</p>
                    </div>
                    <button
                      onClick={copySnippet}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <pre className="bg-stone-50 border border-stone-100 rounded-xl p-4 text-xs text-stone-600 overflow-x-auto font-mono leading-relaxed">
{`<script\n  src="http://localhost:5173/dist/widget.iife.js"\n  data-site-id="${selected.siteId}"\n></script>`}
                  </pre>
                </div>
              )}

              {/* Unanswered queries for this site */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-stone-900 mb-0.5">Unanswered queries</h2>
                <p className="text-xs text-stone-400 mb-4">Questions from visitors that couldn't be answered automatically.</p>

                {queries.filter(q => q.siteId === selected.siteId).length === 0 ? (
                  <div className="text-center py-8 text-xs text-stone-300">No unanswered queries for this site</div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {queries.filter(q => q.siteId === selected.siteId).map(q => (
                      <div key={q.id} className="py-3.5 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm text-stone-700">{q.question}</p>
                          {q.email && (
                            <p className="text-xs text-stone-400 mt-0.5">{q.email}</p>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {q.language && (
                            <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full uppercase">{q.language}</span>
                          )}
                          <span className="text-xs text-stone-300">
                            {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
const API_BASE = "http://localhost:4000"

export async function askQuestion(siteId: string, question: string) {
  const res = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteId, question })
  })
  return res.json()
}

export async function submitEmail(siteId: string, question: string, email: string, language: string) {
  const res = await fetch(`${API_BASE}/ask/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteId, question, email, language })
  })
  return res.json()
}
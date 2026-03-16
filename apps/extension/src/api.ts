const API = "http://localhost:4000"

export async function registerSite(url: string, languages: string[]) {
  const res = await fetch(`${API}/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, languages })
  })
  return res.json()
}

export async function getSiteStatus(siteId: string) {
  const res = await fetch(`${API}/sites/${siteId}`)
  return res.json()
}

export async function askQuestion(siteId: string, question: string) {
  const res = await fetch(`${API}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteId, question })
  })
  return res.json()
}

export async function submitEmail(siteId: string, question: string, email: string, language: string) {
  const res = await fetch(`${API}/ask/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteId, question, email, language })
  })
  return res.json()
}
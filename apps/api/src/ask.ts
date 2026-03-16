import { GoogleGenAI } from "@google/genai"
import Groq from "groq-sdk"
import { db, pool, embeddings, translations, unansweredQueries, eq, sql } from "@blaze/db"

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

// Step 1: Detect language (Groq)
async function detectLanguage(text: string): Promise<string> {
  try {
    const res = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{
        role: "user",
        content: `Return only the ISO 639-1 language code (e.g. en, fr, es) of this text. No explanation, just the code: "${text}"`
      }],
      max_tokens: 5
    })
    return res.choices[0]?.message?.content?.trim().toLowerCase() ?? "en"
  } catch {
    return "en"
  }
}

// Step 2: Embed question (Gemini — keep as-is, vectors already stored with this model)
async function embedQuestion(text: string): Promise<number[]> {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text
  })
  return result.embeddings![0]!.values!
}

// Step 3: Vector search filtered by language
async function searchChunks(vector: number[], language: string, siteId: string) {
  console.log("Searching with siteId:", siteId, "language:", language)
  const vectorStr = `[${vector.join(",")}]`

  try {
    const result = await pool.query(`
      SELECT 
        e.chunk_text,
        e.position_index,
        t.language,
        1 - (e.vector <=> $1::vector) AS similarity
      FROM embeddings e
      JOIN translations t ON t.id = e.translation_id
      JOIN pages p ON p.id = t.page_id
      WHERE p.website_id = $2::uuid
        AND t.language = $3
      ORDER BY e.vector <=> $1::vector
      LIMIT 3
    `, [vectorStr, siteId, language])

    console.log("Query result rows:", result.rows.length)
    return result.rows as { chunk_text: string; similarity: number; language: string }[]
  } catch (err) {
    console.error("searchChunks SQL error:", err)
    return []
  }
}

// Step 4: Generate answer (Groq)
async function generateAnswer(question: string, chunks: { chunk_text: string }[], language: string): Promise<string> {
  const context = chunks.map(c => c.chunk_text).join("\n\n")

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a helpful website assistant. You answer visitor questions strictly based on the provided website content.

Rules:
- Answer ONLY from the context provided. Never use outside knowledge.
- Be concise and friendly. 2-3 sentences max.
- Respond in the same language as the question (language: ${language}).
- If the context does not contain the answer, respond with exactly: "not found"
- Never make up information.`
      },
      {
        role: "user",
        content: `Context from website:
${context}

Visitor question: ${question}`
      }
    ]
  })

  return response.choices[0]?.message?.content?.trim() ?? "not found"
}

// POST /ask
export async function handleAsk(siteId: string, question: string) {
  const language = await detectLanguage(question)
  const vector = await embedQuestion(question)

  let chunks = await searchChunks(vector, language, siteId)
  console.log("Detected language:", language)
  console.log("Chunks found:", chunks.length)
  console.log("Top similarity:", chunks[0]?.similarity)
  console.log("All similarities:", chunks.map(c => c.similarity))

  if (chunks.length === 0) {
    chunks = await searchChunks(vector, "en", siteId)
  }

  const topSimilarity = chunks[0]?.similarity ?? 0
  if (chunks.length === 0 || topSimilarity < 0.5) {
    return { answer: null, needsEmail: true }
  }

  const answer = await generateAnswer(question, chunks, language)

  if (answer === "not found") {
    return { answer: null, needsEmail: true }
  }

  return {
    answer,
    needsEmail: false,
    language,
    confidence: topSimilarity
  }
}

// POST /ask/email
export async function handleEmailCapture(siteId: string, question: string, email: string, language: string) {
  await db.insert(unansweredQueries).values({
    siteId,
    question,
    email,
    language
  })
}
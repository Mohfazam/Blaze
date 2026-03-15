import { GoogleGenAI } from "@google/genai"
import { db, pool, embeddings, translations, unansweredQueries, eq, sql } from "@blaze/db"

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

// Step 1: Detect language
async function detectLanguage(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Return only the ISO 639-1 language code (e.g. en, fr, es) of this text. No explanation, just the code: "${text}"`
    })
    return response.text?.trim().toLowerCase() ?? "en"
  } catch {
    return "en"
  }
}

// Step 2: Embed question
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

// Step 4+5: Generate answer from chunks
async function generateAnswer(question: string, chunks: { chunk_text: string }[]): Promise<string> {
  const context = chunks.map(c => c.chunk_text).join("\n\n")

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are answering using ONLY the provided context. Do not use outside knowledge. If the answer is not found in the context, say "not found".

Context:
${context}

Question: ${question}`
  })

  return response.text?.trim() ?? "not found"
}

// POST /ask
export async function handleAsk(siteId: string, question: string) {
  // 1. Detect language
  const language = await detectLanguage(question)

  // 2. Embed question
  const vector = await embedQuestion(question)

  // 3. Search in detected language
  let chunks = await searchChunks(vector, language, siteId)
  console.log("Detected language:", language)
console.log("Chunks found:", chunks.length)
console.log("Top similarity:", chunks[0]?.similarity)
console.log("All similarities:", chunks.map(c => c.similarity))

  // 4. Fallback to English if no results
  if (chunks.length === 0) {
    chunks = await searchChunks(vector, "en", siteId)
  }

  // 5. Threshold check — distance > 0.5 means weak
  const topSimilarity = chunks[0]?.similarity ?? 0
  if (chunks.length === 0 || topSimilarity < 0.5) {
    return { answer: null, needsEmail: true }
  }

  // 6. Generate grounded answer
  const answer = await generateAnswer(question, chunks)

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
import { GoogleGenerativeAI } from "@google/generative-ai"

const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
const model = genai.getGenerativeModel({ model: "text-embedding-004" })

export interface TextChunk {
  text: string
  index: number
}

export function chunkText(text: string, chunkSize = 500): TextChunk[] {
  const sentences = text.split(/\n+/).filter(s => s.trim().length > 0)
  const chunks: TextChunk[] = []
  let current = ""
  let index = 0

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current.length > 0) {
      chunks.push({ text: current.trim(), index: index++ })
      current = sentence
    } else {
      current += "\n" + sentence
    }
  }

  if (current.trim().length > 0) {
    chunks.push({ text: current.trim(), index: index++ })
  }

  return chunks
}

export async function embedChunks(
  chunks: TextChunk[]
): Promise<{ text: string; index: number; vector: number[] }[]> {
  const results = await Promise.all(
    chunks.map(chunk => model.embedContent(chunk.text))
  )

  return chunks.map((chunk, i) => ({
    text: chunk.text,
    index: chunk.index,
    vector: results[i]!.embedding.values
  }))
}
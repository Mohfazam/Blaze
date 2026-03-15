import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import {CreateSiteSchema} from "@blaze/types"
import {processSite} from "./processSite"
import { db, websites, pages, translations, eq, pool } from "@blaze/db"
import { handleAsk, handleEmailCapture } from "./ask"


dotenv.config()


const app = express()
app.use(cors())
app.use(express.json())

app.get("/health", (_, res) => {
  res.json({ status: "ok", message: "hello" })

})


app.get("/debug/:siteId", async (req, res) => {
  const result = await pool.query(`
    SELECT t.language, COUNT(e.id) as chunk_count
    FROM translations t
    JOIN pages p ON p.id = t.page_id
    LEFT JOIN embeddings e ON e.translation_id = t.id
    WHERE p.website_id = $1
    GROUP BY t.language
  `, [req.params.siteId])

  res.json(result.rows)
})


app.get("/db-test", async (_, res) => {
  try {
    const result = await db.insert(websites).values({
      url: "https://test.com",
      status: "pending"
    }).returning()

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "DB failed" })
  }
});

app.get("/sites/:id", async (req, res) => {
  const { id } = req.params

  try {
    const result = await db
      .select()
      .from(websites)
      .where(eq(websites.id, id))

    if (result.length === 0) {
      return res.status(404).json({ error: "Site not found" })
    }

    const site = result[0]

    return res.json({
      siteId: site!.id,
      status: site!.status
    })

  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch status" })
  }
})

app.get("/sites/:id/translations", async (req, res) => {
  const { id } = req.params

  const pageResult = await db
    .select()
    .from(pages)
    .where(eq(pages.websiteId, id))

  if (pageResult.length === 0) {
    return res.status(404).json({ error: "No pages found" })
  }

  const pageId = pageResult[0]!.id

  const result = await db
    .select()
    .from(translations)
    .where(eq(translations.pageId, pageId))

  return res.json(result)
})

//POST ROutes//


app.post("/ask", async (req, res) => {
  const { siteId, question } = req.body

  if (!siteId || !question) {
    return res.status(400).json({ error: "siteId and question are required" })
  }

  try {
    const result = await handleAsk(siteId, question)
    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Ask failed" })
  }
})

app.post("/ask/email", async (req, res) => {
  const { siteId, question, email, language } = req.body

  if (!siteId || !question || !email) {
    return res.status(400).json({ error: "siteId, question and email are required" })
  }

  try {
    await handleEmailCapture(siteId, question, email, language ?? "en")
    return res.json({ captured: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Email capture failed" })
  }
})


app.post("/sites", async (req, res) => {
  const parsed = CreateSiteSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" })
  }

  const { url, languages } = parsed.data

  try {
    const result = await db.insert(websites).values({
      url,
      status: "pending",
      languages
    }).returning()

    const siteId = result[0]!.id

    // Fire async process without blocking request
    void processSite(siteId)

    return res.json({
      siteId,
      status: "pending"
    })

  } catch (err) {
    return res.status(500).json({ error: "Failed to create site" })
  }
})


const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Blaze API running on port ${PORT}`)
})
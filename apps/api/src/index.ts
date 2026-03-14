import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import {CreateSiteSchema} from "@blaze/types"

import { db, websites } from "@blaze/db"

dotenv.config()


const app = express()
app.use(cors())
app.use(express.json())

app.get("/health", (_, res) => {
  res.json({ status: "ok", message: "hello" })

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


app.post("/sites", async (req, res) => {
  const parsed = CreateSiteSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" })
  }

  const { url, languages } = parsed.data

  const result = await db.insert(websites).values({
    url,
    status: "pending"
  }).returning()

  res.json({
    siteId: result[0]!.id,
    status: "pending"
  })
})


const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Blaze API running on port ${PORT}`)
})
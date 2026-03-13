import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import {hello} from "@blaze/types"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.get("/health", (_, res) => {
  res.json({ status: "ok", message: hello })
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Blaze API running on port ${PORT}`)
})
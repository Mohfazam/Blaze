import { pgTable, uuid, text, timestamp, integer, vector, json } from "drizzle-orm/pg-core"

/* Websites */

export const websites = pgTable("websites", {
  id: uuid("id").primaryKey().defaultRandom(),

  url: text("url").notNull(),

  status: text("status").notNull(),

  // Store selected languages
  languages: json("languages").$type<string[]>().notNull().default([]),

  createdAt: timestamp("created_at").defaultNow()
})

/* Pages */

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  baseText: text("base_text").notNull(),

  websiteId: uuid("website_id")
    .notNull()
    .references(() => websites.id),

  url: text("url").notNull(),
  

  title: text("title"),

  contentHash: text("content_hash"),

  lastCrawledAt: timestamp("last_crawled_at")
})

/* Translations */

export const translations = pgTable("translations", {
  id: uuid("id").primaryKey().defaultRandom(),

  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id),

  language: text("language").notNull(),

  translatedText: text("translated_text").notNull(),

  versionHash: text("version_hash")
})

/* Embeddings */

export const embeddings = pgTable("embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),

  translationId: uuid("translation_id")
    .notNull()
    .references(() => translations.id),

  chunkText: text("chunk_text").notNull(),

  headingText: text("heading_text"),

  headingId: text("heading_id"),

  positionIndex: integer("position_index"),

  vector: vector("vector", { dimensions: 1536 })
})

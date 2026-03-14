import { pgTable, uuid, text, timestamp, integer, vector } from "drizzle-orm/pg-core"

export const websites = pgTable("websites", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow()
})

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),

  websiteId: uuid("website_id")
    .notNull()
    .references(() => websites.id),

  url: text("url").notNull(),
  title: text("title"),
  contentHash: text("content_hash"),
  lastCrawledAt: timestamp("last_crawled_at")
})

export const translations = pgTable("translations", {
  id: uuid("id").primaryKey().defaultRandom(),

  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id),

  language: text("language").notNull(),
  translatedText: text("translated_text").notNull(),
  versionHash: text("version_hash")
})

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
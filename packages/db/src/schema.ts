import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"

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
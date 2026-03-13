import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"

export const websites = pgTable("websites", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow()
})
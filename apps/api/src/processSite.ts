
import { db, websites, eq } from "@blaze/db"
import {crawler} from "@blaze/crawler"

export async function processSite(siteId: string) {
  try {
    await db.update(websites)
      .set({ status: "crawling" })
      .where(eq(websites.id, siteId))

    // TODO: crawl, translate, embed

    await db.update(websites)
      .set({ status: "ready" })
      .where(eq(websites.id, siteId))

  } catch (err) {
    await db.update(websites)
      .set({ status: "failed" })
      .where(eq(websites.id, siteId))
  }
}

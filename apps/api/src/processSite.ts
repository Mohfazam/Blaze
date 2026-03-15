import { db, websites, eq, pages} from "@blaze/db"
import {crawlPage} from "@blaze/crawler"
import crypto from "crypto"

export async function processSite(siteId: string) {
  try {
    // 1. Get website record
    const siteResult = await db
      .select()
      .from(websites)
      .where(eq(websites.id, siteId))

    if (siteResult.length === 0) {
      throw new Error("Site not found")
    }

    const site = siteResult[0]

    // 2. Update status → crawling
    await db.update(websites)
      .set({ status: "crawling" })
      .where(eq(websites.id, siteId))

    // 3. Crawl base page
    const crawled = await crawlPage(site!.url)

    // 4. Hash content
    const contentHash = crypto
      .createHash("sha256")
      .update(crawled.text)
      .digest("hex")

    // 5. Store page
    await db.insert(pages).values({
      websiteId: siteId,
      url: crawled.url,
      title: crawled.title,
      contentHash,
      lastCrawledAt: new Date()
    })

    // 6. Mark ready (temporary)
    await db.update(websites)
      .set({ status: "ready" })
      .where(eq(websites.id, siteId))

  } catch (err) {
    console.error(err)

    await db.update(websites)
      .set({ status: "failed" })
      .where(eq(websites.id, siteId))
  }
}
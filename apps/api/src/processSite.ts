import { db, websites, eq, pages, translations } from "@blaze/db";
import { crawlPage } from "@blaze/crawler";
import { translateText } from "@blaze/i18n";
import crypto from "crypto";

export async function processSite(siteId: string) {
  try {
    // 1. Get website record
    const siteResult = await db
      .select()
      .from(websites)
      .where(eq(websites.id, siteId));

    if (siteResult.length === 0) throw new Error("Site not found");

    const site = siteResult[0]!;

    // 2. Update status → crawling
    await db
      .update(websites)
      .set({ status: "crawling" })
      .where(eq(websites.id, siteId));

    // 3. Crawl base page
    const crawled = await crawlPage(site.url);

    // 4. Hash content
    const contentHash = crypto
      .createHash("sha256")
      .update(crawled.text)
      .digest("hex");

    // 5. Store page with baseText
    const pageResult = await db
      .insert(pages)
      .values({
        websiteId: siteId,
        url: crawled.url,
        title: crawled.title,
        baseText: crawled.text, // 👈 store original English text
        contentHash,
        lastCrawledAt: new Date(),
      })
      .returning();

    const pageId = pageResult[0]!.id;

    // 6. Update status → translating
    await db
      .update(websites)
      .set({ status: "translating" })
      .where(eq(websites.id, siteId));

    // 7. Translate into all target languages
    const targetLanguages = site.languages ?? [];

    if (targetLanguages.length > 0) {
      const translated = await translateText(crawled.text, targetLanguages);

      // 8. Store each translation

      await db.insert(translations).values(
        Object.entries(translated).map(([language, translatedText]) => ({
          pageId,
          language,
          translatedText: translatedText as string, // 👈 cast to string
          versionHash: contentHash,
        })),
      );
    }

    // 9. Mark ready
    await db
      .update(websites)
      .set({ status: "ready" })
      .where(eq(websites.id, siteId));
  } catch (err) {
    console.error(err);

    await db
      .update(websites)
      .set({ status: "failed" })
      .where(eq(websites.id, siteId));
  }
}

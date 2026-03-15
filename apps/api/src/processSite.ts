import { db, websites, eq, pages, translations, embeddings } from "@blaze/db"
import { crawlPage } from "@blaze/crawler"
import { translateText } from "@blaze/i18n"
import { chunkText, embedChunks } from "@blaze/embedder"
import crypto from "crypto"

export async function processSite(siteId: string) {
  try {
    const siteResult = await db.select().from(websites).where(eq(websites.id, siteId))
    if (siteResult.length === 0) throw new Error("Site not found")
    const site = siteResult[0]!

    // crawling
    await db.update(websites).set({ status: "crawling" }).where(eq(websites.id, siteId))
    const crawled = await crawlPage(site.url)
    const contentHash = crypto.createHash("sha256").update(crawled.text).digest("hex")

    const pageResult = await db.insert(pages).values({
      websiteId: siteId,
      url: crawled.url,
      title: crawled.title,
      baseText: crawled.text,
      contentHash,
      lastCrawledAt: new Date()
    }).returning()
    const pageId = pageResult[0]!.id

    // translating
    await db.update(websites).set({ status: "translating" }).where(eq(websites.id, siteId))
    const targetLanguages = site.languages ?? []

    // Always insert English (original) as a translation row so it can be embedded + searched
    const translationRows: { pageId: string; language: string; translatedText: string; versionHash: string }[] = [
      { pageId, language: "en", translatedText: crawled.text, versionHash: contentHash }
    ]

    if (targetLanguages.length > 0) {
      const translated = await translateText(crawled.text, targetLanguages)
      translationRows.push(
        ...Object.entries(translated).map(([language, translatedText]) => ({
          pageId,
          language,
          translatedText: translatedText as string,
          versionHash: contentHash
        }))
      )
    }

    await db.insert(translations).values(translationRows)

    // indexing
    await db.update(websites).set({ status: "indexing" }).where(eq(websites.id, siteId))

    const allTranslations = await db
      .select()
      .from(translations)
      .where(eq(translations.pageId, pageId))

    const toEmbed = allTranslations.map(t => ({ translationId: t.id, text: t.translatedText }))

    for (const { translationId, text } of toEmbed) {
      const chunks = chunkText(text)
      const embedded = await embedChunks(chunks)

      await db.insert(embeddings).values(
        embedded.map(e => ({
          translationId,
          chunkText: e.text,
          positionIndex: e.index,
          vector: e.vector
        }))
      )
    }

    // ready
    await db.update(websites).set({ status: "ready" }).where(eq(websites.id, siteId))

  } catch (err) {
    console.error(err)
    await db.update(websites).set({ status: "failed" }).where(eq(websites.id, siteId))
  }
}
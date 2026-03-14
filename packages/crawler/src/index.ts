import { chromium } from "playwright"

export interface CrawledPage {
  url: string
  title: string | null
  text: string
}

export async function crawlPage(url: string): Promise<CrawledPage> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto(url, { waitUntil: "networkidle" })

  const title = await page.title()

  const text = await page.evaluate(() => {
    return document.body.innerText
  })

  await browser.close()

  return {
    url,
    title,
    text
  }
}

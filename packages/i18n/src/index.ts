import { LingoDotDevEngine } from "lingo.dev/sdk"

const lingo = new LingoDotDevEngine({
  apiKey: process.env.LINGODOTDEV_API_KEY!
})

export async function translateText(
  text: string,
  targetLocales: string[]
): Promise<Record<string, string>> {
  const results = await lingo.batchLocalizeText(text, {
    sourceLocale: "en",
    targetLocales
  } as any)

  return Object.fromEntries(
    targetLocales.map((locale, i) => [locale, (results as string[])[i]!])
  )
}

export async function translateHtml(
  html: string,
  targetLocale: string
): Promise<string> {
  return await lingo.localizeHtml(html, {
    sourceLocale: "en",
    targetLocale
  } as any)
}
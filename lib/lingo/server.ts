import { LingoDotDevEngine } from "lingo.dev/sdk"

let lingoServerInstance: LingoDotDevEngine | null = null

export function getLingoServerClient() {
  if (!lingoServerInstance) {
    const apiKey = process.env.LINGODOTDEV_API_KEY
    if (apiKey) {
      lingoServerInstance = new LingoDotDevEngine({ apiKey })
    }
  }
  return lingoServerInstance
}

export const createLingoClient = getLingoServerClient

export async function translateTextServer(text: string, targetLocale: string, sourceLocale = "es") {
  const lingo = getLingoServerClient()
  if (!lingo) {
    console.warn("Lingo.dev not configured on server, returning original text")
    return text
  }

  try {
    const translated = await lingo.localizeText(text, {
      sourceLocale,
      targetLocale,
    })
    return translated
  } catch (error) {
    console.error("Server translation error:", error)
    return text
  }
}

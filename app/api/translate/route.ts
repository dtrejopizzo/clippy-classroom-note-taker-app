import { type NextRequest, NextResponse } from "next/server"
import { createLingoClient } from "@/lib/lingo/server"

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Missing text or targetLanguage" }, { status: 400 })
    }

    const lingo = createLingoClient()
    const translatedText = await lingo.localizeText(text, {
      targetLanguage,
    })

    return NextResponse.json({ translatedText })
  } catch (error) {
    console.error("[v0] Translation error:", error)
    return NextResponse.json(
      { error: "Translation failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface TranslatedContentProps {
  content: string
  sourceLanguage?: string
}

export function TranslatedContent({ content, sourceLanguage = "es" }: TranslatedContentProps) {
  const [translatedContent, setTranslatedContent] = useState(content)
  const [isTranslating, setIsTranslating] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState("es")
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null)

  useEffect(() => {
    // Get preferred language from localStorage
    const preferred = localStorage.getItem("preferred-language") || "es"
    setCurrentLanguage(preferred)

    // If preferred language is different from source, translate
    if (preferred !== sourceLanguage) {
      setTargetLanguage(preferred)
      translateContent(preferred)
    }

    // Listen for language changes
    const handleLanguageChange = (e: CustomEvent) => {
      const newLang = e.detail
      setCurrentLanguage(newLang)
      if (newLang !== sourceLanguage) {
        setTargetLanguage(newLang)
        translateContent(newLang)
      } else {
        setTargetLanguage(null)
        setTranslatedContent(content)
      }
    }

    window.addEventListener("languageChange", handleLanguageChange as EventListener)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener)
    }
  }, [content, sourceLanguage])

  const translateContent = async (targetLang: string) => {
    setIsTranslating(true)
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: content,
          targetLanguage: targetLang,
        }),
      })

      if (!response.ok) {
        throw new Error("Translation failed")
      }

      const data = await response.json()
      setTranslatedContent(data.translatedText)
    } catch (error) {
      console.error("Translation failed:", error)
      setTranslatedContent(content)
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div className="relative">
      {isTranslating && (
        <div className="absolute top-0 right-0">
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Translating...
          </Badge>
        </div>
      )}
      {targetLanguage && !isTranslating && (
        <div className="absolute top-0 right-0">
          <Badge variant="outline" className="gap-1">
            Translated to {currentLanguage.toUpperCase()}
          </Badge>
        </div>
      )}
      <div className="pt-8">
        <MarkdownRenderer content={translatedContent} />
      </div>
    </div>
  )
}

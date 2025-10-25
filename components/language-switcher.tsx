"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
]

export function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState("en")

  useEffect(() => {
    // Get saved language or detect from browser
    const saved = localStorage.getItem("preferred-language")
    if (saved) {
      setCurrentLanguage(saved)
    } else {
      const browserLang = navigator.language.split("-")[0]
      const supported = LANGUAGES.find((lang) => lang.code === browserLang)
      if (supported) {
        setCurrentLanguage(browserLang)
        localStorage.setItem("preferred-language", browserLang)
      }
    }
  }, [])

  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode)
    localStorage.setItem("preferred-language", langCode)
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent("languageChange", { detail: langCode }))
  }

  const currentLang = LANGUAGES.find((lang) => lang.code === currentLanguage) || LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={currentLanguage === lang.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

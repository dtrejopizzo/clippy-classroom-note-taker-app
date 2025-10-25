"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, LucidePresentation as FilePresentation, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PresentationGeneratorProps {
  title: string
  courseName: string
  summary: string
  date: string
}

export function PresentationGenerator({ title, courseName, summary, date }: PresentationGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const splitContentIntoSlides = (content: string[]): string[][] => {
    const MAX_ITEMS_PER_SLIDE = 5 // Maximum bullet points per slide
    const MAX_CHARS_PER_SLIDE = 600 // Maximum characters per slide

    const slides: string[][] = []
    let currentSlide: string[] = []
    let currentChars = 0

    for (const item of content) {
      const itemLength = item.length

      // Check if adding this item would exceed limits
      if (
        currentSlide.length >= MAX_ITEMS_PER_SLIDE ||
        (currentSlide.length > 0 && currentChars + itemLength > MAX_CHARS_PER_SLIDE)
      ) {
        // Start a new slide
        slides.push(currentSlide)
        currentSlide = [item]
        currentChars = itemLength
      } else {
        // Add to current slide
        currentSlide.push(item)
        currentChars += itemLength
      }
    }

    // Add the last slide if it has content
    if (currentSlide.length > 0) {
      slides.push(currentSlide)
    }

    return slides.length > 0 ? slides : [[]]
  }

  const generatePresentation = async () => {
    setIsGenerating(true)
    try {
      // Dynamic import to avoid SSR issues
      const pptxgen = (await import("pptxgenjs")).default

      const pres = new pptxgen()

      // Set presentation properties
      pres.author = "Clippy - The Teacher's Memory"
      pres.title = title
      pres.subject = courseName

      // Parse summary to extract sections
      const lines = summary.split("\n").filter((line) => line.trim())
      const sections: { title: string; content: string[] }[] = []
      let currentSection: { title: string; content: string[] } | null = null

      for (const line of lines) {
        if (line.startsWith("###")) {
          // New section
          if (currentSection) {
            sections.push(currentSection)
          }
          currentSection = {
            title: line.replace(/^###\s*/, "").replace(/\*\*/g, ""),
            content: [],
          }
        } else if (currentSection && line.trim()) {
          // Add content to current section
          currentSection.content.push(line.replace(/\*\*/g, "").replace(/^-\s*/, "• "))
        }
      }
      if (currentSection) {
        sections.push(currentSection)
      }

      // Slide 1: Title slide
      const titleSlide = pres.addSlide()
      titleSlide.background = { color: "4F46E5" } // Indigo background
      titleSlide.addText(title, {
        x: 0.5,
        y: 2.0,
        w: 9,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: "FFFFFF",
        align: "center",
      })
      titleSlide.addText(courseName, {
        x: 0.5,
        y: 3.8,
        w: 9,
        h: 0.5,
        fontSize: 24,
        color: "E0E7FF",
        align: "center",
      })
      titleSlide.addText(date, {
        x: 0.5,
        y: 4.5,
        w: 9,
        h: 0.4,
        fontSize: 16,
        color: "C7D2FE",
        align: "center",
      })

      // Slide 2: Table of contents
      if (sections.length > 0) {
        const tocSlide = pres.addSlide()
        tocSlide.addText("Índice", {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.8,
          fontSize: 36,
          bold: true,
          color: "1E293B",
        })

        const tocItems = sections.map((section, index) => `${index + 1}. ${section.title}`).join("\n")
        tocSlide.addText(tocItems, {
          x: 1.0,
          y: 1.5,
          w: 8,
          h: 4.0,
          fontSize: 20,
          color: "334155",
          valign: "top",
        })
      }

      let slideNumber = 1
      sections.forEach((section) => {
        const contentSlides = splitContentIntoSlides(section.content)

        contentSlides.forEach((slideContent, partIndex) => {
          const contentSlide = pres.addSlide()

          // Section title with part number if split across multiple slides
          const slideTitle =
            contentSlides.length > 1 ? `${section.title} (${partIndex + 1}/${contentSlides.length})` : section.title

          contentSlide.addText(slideTitle, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
            color: "4F46E5",
          })

          // Section content
          const content = slideContent.join("\n\n")
          contentSlide.addText(content, {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 4.5,
            fontSize: 18,
            color: "1E293B",
            valign: "top",
            lineSpacing: 28,
          })

          // Slide number
          contentSlide.addText(`${slideNumber}`, {
            x: 9.2,
            y: 7.0,
            w: 0.5,
            h: 0.3,
            fontSize: 12,
            color: "94A3B8",
            align: "right",
          })

          slideNumber++
        })
      })

      // Generate and download
      await pres.writeFile({ fileName: `${title.replace(/[^a-z0-9]/gi, "_")}.pptx` })
    } catch (error) {
      console.error("Error generating presentation:", error)
      alert("Error al generar la presentación. Por favor intenta de nuevo.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <FilePresentation className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">Presentación para Clase</h3>
          <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
            Genera una presentación PowerPoint profesional basada en el resumen de la clase. Incluye título, índice y
            slides para cada tema principal.
          </p>
          <Button onClick={generatePresentation} disabled={isGenerating} size="lg" className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generando presentación...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Descargar Presentación
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-card p-6">
        <h4 className="mb-3 font-semibold">La presentación incluirá:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              1
            </span>
            <span>
              <strong className="text-foreground">Slide de título</strong> con el nombre de la clase y curso
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              2
            </span>
            <span>
              <strong className="text-foreground">Índice</strong> con todos los temas principales
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              3
            </span>
            <span>
              <strong className="text-foreground">Slides de contenido</strong> con cada tema del resumen en formato
              presentación
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Compatible con PowerPoint, Google Slides y otras aplicaciones de presentación
        </p>
      </div>
    </div>
  )
}

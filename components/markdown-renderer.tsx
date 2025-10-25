"use client"
import type React from "react"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.JSX.Element[] = []
    let listItems: string[] = []
    let key = 0

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key++}`} className="list-disc pl-6 space-y-2 my-4">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: processBold(item) }} />
            ))}
          </ul>,
        )
        listItems = []
      }
    }

    const processBold = (text: string) => {
      return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    }

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      // Skip empty lines
      if (!trimmedLine) {
        flushList()
        return
      }

      // H3 headings
      if (trimmedLine.startsWith("### ")) {
        flushList()
        const text = trimmedLine.substring(4)
        elements.push(
          <h3 key={`h3-${key++}`} className="text-xl font-bold mt-6 mb-3 text-foreground">
            {text}
          </h3>,
        )
        return
      }

      // H2 headings
      if (trimmedLine.startsWith("## ")) {
        flushList()
        const text = trimmedLine.substring(3)
        elements.push(
          <h2 key={`h2-${key++}`} className="text-2xl font-bold mt-8 mb-4 text-foreground">
            {text}
          </h2>,
        )
        return
      }

      // H1 headings
      if (trimmedLine.startsWith("# ")) {
        flushList()
        const text = trimmedLine.substring(2)
        elements.push(
          <h1 key={`h1-${key++}`} className="text-3xl font-bold mt-8 mb-4 text-foreground">
            {text}
          </h1>,
        )
        return
      }

      // List items
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        const text = trimmedLine.substring(2)
        listItems.push(text)
        return
      }

      // Regular paragraphs
      flushList()
      if (trimmedLine) {
        elements.push(
          <p
            key={`p-${key++}`}
            className="mb-4 text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processBold(trimmedLine) }}
          />,
        )
      }
    })

    // Flush any remaining list items
    flushList()

    return elements
  }

  return <div className="space-y-2">{renderMarkdown(content)}</div>
}

"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface DownloadButtonProps {
  audioUrl: string
  title: string
}

export function DownloadButton({ audioUrl, title }: DownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(audioUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title}.webm`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} className="bg-transparent">
      <Download className="mr-2 h-4 w-4" />
      Download
    </Button>
  )
}

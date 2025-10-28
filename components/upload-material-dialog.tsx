"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, File } from "lucide-react"
import { useRouter } from "next/navigation"

interface UploadMaterialDialogProps {
  courseId: string
}

export function UploadMaterialDialog({ courseId }: UploadMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState("")
  const [uploadType, setUploadType] = useState<"file" | "text">("file")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("courseId", courseId)
      formData.append("title", title)

      if (uploadType === "file" && file) {
        formData.append("file", file)
        formData.append("fileType", file.type.includes("pdf") ? "pdf" : "text")
      } else if (uploadType === "text") {
        formData.append("content", textContent)
        formData.append("fileType", "text")
      }

      const response = await fetch("/api/upload-material", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload material")
      }

      setOpen(false)
      setTitle("")
      setFile(null)
      setTextContent("")
      router.refresh()
    } catch (err) {
      console.error("[v0] Error uploading material:", err)
      setError(err instanceof Error ? err.message : "Failed to upload material")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Material
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Course Material</DialogTitle>
            <DialogDescription>Add PDFs or text content to your course for AI-powered Q&A</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 1 Notes"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Upload Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={uploadType === "file" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setUploadType("file")}
                >
                  <File className="mr-2 h-4 w-4" />
                  File Upload
                </Button>
                <Button
                  type="button"
                  variant={uploadType === "text" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setUploadType("text")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Text Input
                </Button>
              </div>
            </div>

            {uploadType === "file" ? (
              <div className="grid gap-2">
                <Label htmlFor="file">File (PDF or TXT)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-sm text-muted-foreground">Upload a PDF or text file</p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="text-content">Text Content</Label>
                <Textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste your text content here..."
                  rows={8}
                  required
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

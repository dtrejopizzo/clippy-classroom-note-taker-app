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
import { createClient } from "@/lib/supabase/client"
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
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      let fileUrl = ""
      let fileType = ""
      let content = ""

      if (uploadType === "file" && file) {
        // Upload file to Supabase Storage
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/${courseId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("course-materials").upload(fileName, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("course-materials").getPublicUrl(fileName)

        fileUrl = publicUrl
        fileType = file.type.includes("pdf") ? "pdf" : "text"

        // For text files, read content directly
        if (fileType === "text") {
          content = await file.text()
        }
      } else if (uploadType === "text") {
        // For plain text input, create a text file
        const fileName = `${user.id}/${courseId}/${Date.now()}.txt`
        const textBlob = new Blob([textContent], { type: "text/plain" })

        const { error: uploadError } = await supabase.storage.from("course-materials").upload(fileName, textBlob)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("course-materials").getPublicUrl(fileName)

        fileUrl = publicUrl
        fileType = "text"
        content = textContent
      }

      // Insert material record
      const { error: insertError } = await supabase.from("course_materials").insert({
        course_id: courseId,
        teacher_id: user.id,
        title,
        file_type: fileType,
        file_url: fileUrl,
        content: fileType === "text" ? content : null,
      })

      if (insertError) throw insertError

      // Trigger document processing
      const processResponse = await fetch("/api/process-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, fileUrl, fileType }),
      })

      if (!processResponse.ok) {
        const errorData = await processResponse.json()
        throw new Error(errorData.error || "Failed to process material")
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

"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mic, Square, Play, Pause, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface AudioRecorderProps {
  courseId: string
  courseName: string
}

export function AudioRecorder({ courseId, courseName }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  const router = useRouter()

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      startTimeRef.current = Date.now() - pausedTimeRef.current
      setError(null)

      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err) {
      setError("Failed to access microphone. Please check your permissions.")
      console.error("Error accessing microphone:", err)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      pausedTimeRef.current = Date.now() - startTimeRef.current
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      startTimeRef.current = Date.now() - pausedTimeRef.current

      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const saveRecording = async () => {
    if (!audioBlob || !title.trim()) {
      setError("Please provide a title for the recording")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Upload audio file to Supabase Storage
      const fileName = `${user.id}/${courseId}/${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(fileName, audioBlob)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("recordings").getPublicUrl(fileName)

      // Create recording record
      const { data: recording, error: insertError } = await supabase
        .from("recordings")
        .insert({
          course_id: courseId,
          teacher_id: user.id,
          title: title.trim(),
          audio_url: publicUrl,
          duration_seconds: recordingTime,
          status: "processing",
        })
        .select()
        .single()

      if (insertError) throw insertError

      const response = await fetch("/api/process-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordingId: recording.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Processing failed: ${errorData.details || errorData.message || errorData.error || "Unknown error"}`,
        )
      }

      router.push(`/courses/${courseId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recording")
      console.error("Error saving recording:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild disabled={isRecording}>
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{courseName}</h1>
            <p className="text-xs text-muted-foreground">New Recording</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Record Lecture</CardTitle>
              <CardDescription>Capture your classroom lecture with no time limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recording Timer */}
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                  <Mic
                    className={`h-16 w-16 ${isRecording && !isPaused ? "text-red-500 animate-pulse" : "text-primary"}`}
                  />
                </div>
                <div className="text-5xl font-bold tabular-nums text-foreground">{formatTime(recordingTime)}</div>
                {isRecording && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    {isPaused ? "Paused" : "Recording"}
                  </div>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center gap-3">
                {!isRecording && !audioBlob && (
                  <Button size="lg" onClick={startRecording} className="h-14 px-8">
                    <Mic className="mr-2 h-5 w-5" />
                    Start Recording
                  </Button>
                )}

                {isRecording && !isPaused && (
                  <>
                    <Button size="lg" variant="outline" onClick={pauseRecording} className="h-14 px-8 bg-transparent">
                      <Pause className="mr-2 h-5 w-5" />
                      Pause
                    </Button>
                    <Button size="lg" variant="destructive" onClick={stopRecording} className="h-14 px-8">
                      <Square className="mr-2 h-5 w-5" />
                      Stop
                    </Button>
                  </>
                )}

                {isRecording && isPaused && (
                  <>
                    <Button size="lg" onClick={resumeRecording} className="h-14 px-8">
                      <Play className="mr-2 h-5 w-5" />
                      Resume
                    </Button>
                    <Button size="lg" variant="destructive" onClick={stopRecording} className="h-14 px-8">
                      <Square className="mr-2 h-5 w-5" />
                      Stop
                    </Button>
                  </>
                )}
              </div>

              {/* Audio Preview & Save */}
              {audioBlob && (
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <Label htmlFor="title">Recording Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Lecture 1: Introduction to Biology"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  {audioUrl && (
                    <div>
                      <Label>Preview</Label>
                      <audio controls src={audioUrl} className="mt-2 w-full" />
                    </div>
                  )}

                  {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                  <div className="flex gap-3">
                    <Button
                      onClick={saveRecording}
                      disabled={isSaving || !title.trim()}
                      className="flex-1 h-12"
                      size="lg"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Save & Process
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAudioBlob(null)
                        setAudioUrl(null)
                        setTitle("")
                        setRecordingTime(0)
                        pausedTimeRef.current = 0
                      }}
                      disabled={isSaving}
                      className="bg-transparent"
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              )}

              {error && !audioBlob && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

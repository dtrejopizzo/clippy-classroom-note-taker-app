import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, FileText, BookOpen, Sparkles } from "lucide-react"
import Link from "next/link"
import { DownloadButton } from "@/components/download-button"
import { TranslatedContent } from "@/components/translated-content"
import { LanguageSwitcher } from "@/components/language-switcher"
import { PresentationGenerator } from "@/components/presentation-generator"

export default async function RecordingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch recording
  const { data: recording, error: recordingError } = await supabase
    .from("recordings")
    .select("*, courses(name)")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single()

  if (recordingError || !recording) {
    redirect("/dashboard")
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`
    }
    return `${mins}m ${secs}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/courses/${recording.course_id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{recording.title}</h1>
            <p className="text-xs text-muted-foreground">{recording.courses?.name}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Recording Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{recording.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(recording.duration_seconds)}
                    </span>
                    <span>{formatDate(recording.created_at)}</span>
                  </CardDescription>
                </div>
                {recording.status === "completed" && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
                )}
                {recording.status === "processing" && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Processing</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recording.audio_url && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Audio Recording</p>
                    <DownloadButton audioUrl={recording.audio_url} title={recording.title} />
                  </div>
                  <audio controls src={recording.audio_url} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Tabs */}
          {recording.status === "completed" && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="transcript" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="materials" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Study Materials
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Lecture Summary
                    </CardTitle>
                    <CardDescription>AI-generated summary with key points for students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <TranslatedContent content={recording.summary || ""} sourceLanguage="es" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Full Transcription
                    </CardTitle>
                    <CardDescription>Complete text transcription of the lecture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <TranslatedContent content={recording.transcription || ""} sourceLanguage="es" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="materials" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Study Materials
                    </CardTitle>
                    <CardDescription>Comprehensive study guide for students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PresentationGenerator
                      title={recording.title}
                      courseName={recording.courses?.name || "Course"}
                      summary={recording.summary || ""}
                      date={formatDate(recording.created_at)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {recording.status === "processing" && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center">
                  <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Processing Recording</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  Clippy is transcribing your lecture and generating study materials. This may take a few minutes
                  depending on the length of the recording.
                </p>
              </CardContent>
            </Card>
          )}

          {recording.status === "failed" && (
            <Card className="border-destructive">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <h3 className="mb-2 text-xl font-semibold text-destructive">Processing Failed</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  There was an error processing this recording. Please try recording again.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

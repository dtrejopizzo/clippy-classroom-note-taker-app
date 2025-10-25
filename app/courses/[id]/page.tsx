import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Mic } from "lucide-react"
import Link from "next/link"
import { RecordingCard } from "@/components/recording-card"
import { StartRecordingButton } from "@/components/start-recording-button"

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch course
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single()

  if (courseError || !course) {
    redirect("/dashboard")
  }

  // Fetch recordings
  const { data: recordings } = await supabase
    .from("recordings")
    .select("*")
    .eq("course_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{course.name}</h1>
            <p className="text-xs text-muted-foreground">{course.description || "No description"}</p>
          </div>
          <StartRecordingButton courseId={course.id} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Recordings</h2>
          <p className="text-muted-foreground">All lecture recordings for this course</p>
        </div>

        {!recordings || recordings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Mic className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No recordings yet</h3>
              <p className="mb-6 text-center text-muted-foreground max-w-sm">
                Start your first recording to capture your lecture and generate study materials.
              </p>
              <StartRecordingButton courseId={course.id} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {recordings.map((recording) => (
              <RecordingCard key={recording.id} recording={recording} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

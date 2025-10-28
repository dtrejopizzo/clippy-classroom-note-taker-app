import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Mic, FileText, FileIcon } from "lucide-react"
import Link from "next/link"
import { RecordingCard } from "@/components/recording-card"
import { StartRecordingButton } from "@/components/start-recording-button"
import { UploadMaterialDialog } from "@/components/upload-material-dialog"
import { CourseChat } from "@/components/course-chat"

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

  const { data: materials } = await supabase
    .from("course_materials")
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
          <CourseChat courseId={course.id} />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Course Materials</h2>
              <p className="text-sm text-muted-foreground">PDFs and text files for AI-powered Q&A</p>
            </div>
            <UploadMaterialDialog courseId={course.id} />
          </div>

          {!materials || materials.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No materials yet</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground max-w-sm">
                  Upload PDFs or text files to enable AI-powered questions and answers about your course.
                </p>
                <UploadMaterialDialog courseId={course.id} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        {material.file_type === "pdf" ? (
                          <FileIcon className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{material.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {material.file_type.toUpperCase()} • {new Date(material.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

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

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AudioRecorder } from "@/components/audio-recorder"

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
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

  return <AudioRecorder courseId={course.id} courseName={course.name} />
}
